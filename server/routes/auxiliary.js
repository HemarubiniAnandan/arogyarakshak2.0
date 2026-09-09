const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { triage } = require('../engines/triageEngine');
const { rankPriorityQueue } = require('../engines/priorityQueueEngine');
const { rankAlternatives } = require('../engines/reappointmentEngine');

module.exports = function(db, notificationService) {
  // POST /api/triage — run triage engine
  router.post('/triage', (req, res) => {
    try {
      const { symptoms, patientContext } = req.body;
      const result = triage(symptoms, patientContext || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Triage failed.' });
    }
  });

  // GET /api/facilities — list all facilities
  router.get('/facilities', (req, res) => {
    try {
      const facilities = db.prepare('SELECT * FROM facilities ORDER BY name').all();
      res.json(facilities);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch facilities.' });
    }
  });

  // PUT /api/facilities/:id/toggle-emergency — facility staff emergency toggle
  router.put('/facilities/:id/toggle-emergency', authenticateToken, authorizeRoles('facility_staff', 'district_official'), (req, res) => {
    try {
      const fac = db.prepare('SELECT * FROM facilities WHERE facility_id = ?').get(req.params.id);
      if (!fac) return res.status(404).json({ error: 'Facility not found.' });

      const newStatus = fac.emergency_accepted ? 0 : 1;
      db.prepare('UPDATE facilities SET emergency_accepted = ? WHERE facility_id = ?').run(newStatus, req.params.id);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'facility', req.params.id, 'emergency_toggle', req.user.user_id, `Emergency status changed to ${newStatus ? 'ACCEPTED' : 'PAUSED'}`
      );

      res.json({ message: `Emergency acceptance updated to ${newStatus ? 'Yes' : 'No'}`, emergency_accepted: newStatus });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle emergency status.' });
    }
  });

  // PUT /api/facilities/:id/capacity — update bed / staff counts
  router.put('/facilities/:id/capacity', authenticateToken, authorizeRoles('facility_staff'), (req, res) => {
    try {
      const { bed_count, staff_count, readiness_score } = req.body;
      db.prepare('UPDATE facilities SET bed_count = ?, staff_count = ?, readiness_score = ? WHERE facility_id = ?').run(
        bed_count, staff_count, readiness_score, req.params.id
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'facility', req.params.id, 'capacity_update', req.user.user_id, `Beds: ${bed_count}, Staff: ${staff_count}, Readiness: ${readiness_score}`
      );

      res.json({ message: 'Capacity updated.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update capacity.' });
    }
  });

  // GET /api/doctors — list doctors
  router.get('/doctors', (req, res) => {
    try {
      const doctors = db.prepare('SELECT d.*, f.name as facility_name FROM doctors d LEFT JOIN facilities f ON d.facility_id = f.facility_id').all();
      res.json(doctors);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch doctors.' });
    }
  });

  // PUT /api/doctors/:id/unavailable — mark doctor unavailable with reason (triggers reappointment)
  router.put('/doctors/:id/unavailable', authenticateToken, authorizeRoles('doctor', 'facility_staff'), async (req, res) => {
    try {
      const { reason, date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const doctor = db.prepare('SELECT * FROM doctors WHERE doctor_id = ?').get(req.params.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });

      // Update doctor status
      db.prepare("UPDATE doctors SET status = 'unavailable' WHERE doctor_id = ?").run(req.params.id);
      db.prepare("UPDATE doctor_availability SET status = 'unavailable' WHERE doctor_id = ? AND date = ?").run(req.params.id, targetDate);

      // Find affected appointments
      const affected = db.prepare("SELECT a.*, p.phone as patient_phone, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id = p.patient_id WHERE a.doctor_id = ? AND a.date = ? AND a.status = 'booked'").all(req.params.id, targetDate);

      const notifyResults = [];
      for (const apt of affected) {
        db.prepare("UPDATE appointments SET status = 'cancelled', change_reason = ? WHERE appointment_id = ?").run(`Doctor unavailable: ${reason || 'Unspecified'}`, apt.appointment_id);

        const msg = `Namaskar ${apt.patient_name}, Dr. ${doctor.name} is unavailable today due to ${reason || 'emergency'}. Please call your ASHA or rebook.`;
        if (notificationService) {
          const callRes = await notificationService.makeVoiceCall(apt.patient_phone || '+919876500000', msg);
          notifyResults.push({ appointment_id: apt.appointment_id, notify: callRes });
        }
      }

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'doctor', req.params.id, 'mark_unavailable', req.user.user_id, `Reason: ${reason || 'Unspecified'}, Affected apts: ${affected.length}`
      );

      res.json({ message: `Doctor marked unavailable. ${affected.length} appointments cancelled and notified.`, affected_count: affected.length, notifyResults });
    } catch (err) {
      console.error('Doctor unavailable error:', err);
      res.status(500).json({ error: 'Failed to update doctor availability.' });
    }
  });

  // GET /api/priority-flags — priority queue endpoint (uses priorityQueueEngine)
  router.get('/priority-flags', authenticateToken, (req, res) => {
    try {
      const rawFlags = db.prepare(`
        SELECT pf.*, p.name as patient_name, p.phone as patient_phone, p.village, p.asha_id,
               (SELECT COUNT(*) FROM reminders r WHERE r.patient_id = pf.patient_id AND r.delivery_status = 'failed') as failed_followups
        FROM priority_flags pf
        JOIN patients p ON pf.patient_id = p.patient_id
        WHERE pf.resolved_status = 0
      `).all();

      const ranked = rankPriorityQueue(rawFlags);
      res.json(ranked);
    } catch (err) {
      console.error('Priority flags error:', err);
      res.status(500).json({ error: 'Failed to fetch priority queue.' });
    }
  });

  // PUT /api/priority-flags/:id/resolve
  router.put('/priority-flags/:id/resolve', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      db.prepare('UPDATE priority_flags SET resolved_status = 1 WHERE id = ?').run(req.params.id);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'priority_flag', req.params.id, 'resolve', req.user.user_id, 'Priority flag marked resolved'
      );

      res.json({ message: 'Priority flag resolved.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to resolve flag.' });
    }
  });

  // POST /api/sos — SOS emergency escalation (7A.7 spec)
  router.post('/sos', (req, res) => {
    try {
      const { lat, lng, patient_id, caller_phone } = req.body;

      // Find nearest emergency-accepted facility
      const facilities = db.prepare('SELECT * FROM facilities WHERE emergency_accepted = 1').all();
      let nearest = facilities[0] || null;

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'sos_escalation', patient_id || 'anonymous', 'sos_trigger', patient_id || 'anonymous', `SOS triggered near lat: ${lat}, lng: ${lng}`
      );

      res.json({
        success: true,
        escalation_ticket_id: `SOS-${uuidv4().slice(0,6).toUpperCase()}`,
        facility: nearest ? nearest.name : 'District Emergency Command Center',
        facility_id: nearest ? nearest.facility_id : null,
        message: `Escalation ticket sent to ${nearest ? nearest.name : 'District Emergency Command Center'}. (Simulated dispatch)`,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to dispatch SOS escalation.' });
    }
  });

  // GET /api/audit-logs — District / Admin audit log viewer
  router.get('/audit-logs', authenticateToken, authorizeRoles('district_official', 'facility_staff'), (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100').all();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
  });

  return router;
};
