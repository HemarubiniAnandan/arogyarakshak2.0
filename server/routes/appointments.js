const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { rankAlternatives } = require('../engines/reappointmentEngine');
const QRCode = require('qrcode');

module.exports = function(db) {
  // GET /api/appointments — list
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { patient_id, doctor_id, facility_id, date, status } = req.query;
      let query = 'SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty, f.name as facility_name, p.name as patient_name, p.phone as patient_phone FROM appointments a LEFT JOIN doctors d ON a.doctor_id = d.doctor_id LEFT JOIN facilities f ON a.facility_id = f.facility_id LEFT JOIN patients p ON a.patient_id = p.patient_id WHERE 1=1';
      const params = [];

      if (patient_id) { query += ' AND a.patient_id = ?'; params.push(patient_id); }
      if (doctor_id) { query += ' AND a.doctor_id = ?'; params.push(doctor_id); }
      if (facility_id) { query += ' AND a.facility_id = ?'; params.push(facility_id); }
      if (date) { query += ' AND a.date = ?'; params.push(date); }
      if (status) { query += ' AND a.status = ?'; params.push(status); }

      // Role-based filtering
      if (req.user.role === 'doctor') {
        query += ' AND a.doctor_id = ?'; params.push(req.user.user_id);
      } else if (req.user.role === 'facility_staff') {
        query += ' AND a.facility_id = ?'; params.push(req.user.facility_id);
      }

      query += ' ORDER BY a.date ASC, a.time ASC';
      const appointments = db.prepare(query).all(...params);
      res.json(appointments);
    } catch (err) {
      console.error('Appointments list error:', err);
      res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
  });

  // POST /api/appointments — book
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { patient_id, doctor_id, facility_id, date, time, visit_type, mobility_needs, home_visit, symptoms, triage_pathway, triage_risk } = req.body;
      if (!patient_id || !doctor_id || !date || !time) {
        return res.status(400).json({ error: 'patient_id, doctor_id, date, and time are required.' });
      }

      // Check slot availability
      const slot = db.prepare('SELECT * FROM doctor_availability WHERE doctor_id = ? AND date = ? AND slot = ? AND status = ?').get(doctor_id, date, time, 'available');
      if (!slot) {
        return res.status(409).json({ error: 'Selected time slot is not available.' });
      }

      // Generate token number
      const dayAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE facility_id = ? AND date = ?').get(facility_id, date);
      const token_number = (dayAppointments?.count || 0) + 1;

      const appointment_id = `APT-${uuidv4().slice(0,8).toUpperCase()}`;

      db.prepare(`INSERT INTO appointments (appointment_id, patient_id, doctor_id, facility_id, date, time, status, booked_by, token_number, visit_type, mobility_needs, home_visit, symptoms, triage_pathway, triage_risk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        appointment_id, patient_id, doctor_id, facility_id || null, date, time, 'booked', req.user.user_id, token_number, visit_type || 'new', mobility_needs || null, home_visit ? 1 : 0, symptoms || null, triage_pathway || null, triage_risk || null
      );

      // Mark slot as booked
      db.prepare('UPDATE doctor_availability SET status = ? WHERE id = ?').run('booked', slot.id);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'appointment', appointment_id, 'book', req.user.user_id, `Booked for ${date} ${time}, token #${token_number}`
      );

      res.status(201).json({ appointment_id, token_number, date, time, doctor_id, facility_id });
    } catch (err) {
      console.error('Appointment book error:', err);
      res.status(500).json({ error: 'Failed to book appointment.' });
    }
  });

  // PUT /api/appointments/:id/cancel
  router.put('/:id/cancel', authenticateToken, (req, res) => {
    try {
      const apt = db.prepare('SELECT * FROM appointments WHERE appointment_id = ?').get(req.params.id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

      const { reason } = req.body;
      db.prepare('UPDATE appointments SET status = ?, change_reason = ? WHERE appointment_id = ?').run('cancelled', reason || 'No reason provided', req.params.id);

      // Free up the slot
      db.prepare('UPDATE doctor_availability SET status = ? WHERE doctor_id = ? AND date = ? AND slot = ?').run('available', apt.doctor_id, apt.date, apt.time);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'appointment', req.params.id, 'cancel', req.user.user_id, reason || 'Cancelled without reason'
      );

      res.json({ message: 'Appointment cancelled.', appointment_id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to cancel appointment.' });
    }
  });

  // PUT /api/appointments/:id/reschedule — triggers reappointment engine
  router.put('/:id/reschedule', authenticateToken, (req, res) => {
    try {
      const apt = db.prepare('SELECT a.*, d.specialty as doctor_specialty FROM appointments a LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.appointment_id = ?').get(req.params.id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

      // Get patient location
      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(apt.patient_id);
      const prefFacility = patient?.preferred_facility ? db.prepare('SELECT lat, lng FROM facilities WHERE facility_id = ?').get(patient.preferred_facility) : null;

      // Get available alternatives
      const availSlots = db.prepare(`
        SELECT da.*, d.doctor_id, d.name as doctor_name, d.specialty as doctor_specialty, 
               f.facility_id, f.name as facility_name, f.lat as facility_lat, f.lng as facility_lng, f.readiness_score as facility_readiness
        FROM doctor_availability da
        JOIN doctors d ON da.doctor_id = d.doctor_id
        JOIN facilities f ON d.facility_id = f.facility_id
        WHERE da.status = 'available' AND da.date >= date('now')
        ORDER BY da.date ASC, da.slot ASC
        LIMIT 20
      `).all();

      const ranked = rankAlternatives(
        { date: apt.date, suggested_specialty: apt.doctor_specialty || apt.triage_pathway },
        availSlots,
        prefFacility || {}
      );

      res.json({ original: apt, alternatives: ranked });
    } catch (err) {
      console.error('Reschedule error:', err);
      res.status(500).json({ error: 'Failed to find alternatives.' });
    }
  });

  // PUT /api/appointments/:id/arrive — QR scan arrival
  router.put('/:id/arrive', authenticateToken, authorizeRoles('facility_staff'), (req, res) => {
    try {
      db.prepare("UPDATE appointments SET arrived_at = datetime('now'), status = 'in_progress' WHERE appointment_id = ?").run(req.params.id);
      
      // Update referral status if exists
      const apt = db.prepare('SELECT patient_id FROM appointments WHERE appointment_id = ?').get(req.params.id);
      if (apt) {
        db.prepare('UPDATE referrals SET status = ? WHERE patient_id = ? AND status = ?').run('arrived', apt.patient_id, 'accepted');
      }

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'appointment', req.params.id, 'arrive', req.user.user_id, 'Patient arrived (QR scan)'
      );

      res.json({ message: 'Arrival recorded.', appointment_id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to record arrival.' });
    }
  });

  // PUT /api/appointments/:id/status — cancel or update status
  router.put('/:id/status', authenticateToken, (req, res) => {
    try {
      const { status, cancel_reason } = req.body;
      db.prepare("UPDATE appointments SET status = ?, remarks_close = ? WHERE appointment_id = ?").run(status, cancel_reason || null, req.params.id);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'appointment', req.params.id, 'status_update', req.user.user_id, `Status changed to ${status}`
      );
      res.json({ message: 'Status updated.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status.' });
    }
  });

  // PUT /api/appointments/:id/seen — doctor confirms seen
  router.put('/:id/seen', authenticateToken, authorizeRoles('doctor', 'facility_staff'), (req, res) => {
    try {
      const { remarks_open, remarks_close, prescription, follow_up } = req.body;
      db.prepare("UPDATE appointments SET seen_at = datetime('now'), status = ?, remarks_open = ?, remarks_close = ?, prescription = ?, follow_up = ? WHERE appointment_id = ?").run(
        'completed', remarks_open || null, remarks_close || null, prescription || null, follow_up ? 1 : 0, req.params.id
      );

      // Update referral status
      const apt = db.prepare('SELECT patient_id FROM appointments WHERE appointment_id = ?').get(req.params.id);
      if (apt) {
        db.prepare('UPDATE referrals SET status = ? WHERE patient_id = ? AND status = ?').run('care_given', apt.patient_id, 'arrived');
      }

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'appointment', req.params.id, 'seen', req.user.user_id, 'Doctor confirmed patient seen'
      );

      res.json({ message: 'Visit completed.', appointment_id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to mark as seen.' });
    }
  });

  // GET /api/appointments/:id/qr — generate QR code
  router.get('/:id/qr', async (req, res) => {
    try {
      const apt = db.prepare('SELECT * FROM appointments WHERE appointment_id = ?').get(req.params.id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

      const qrData = JSON.stringify({ id: apt.appointment_id, token: apt.token_number, date: apt.date, time: apt.time });
      const qrImage = await QRCode.toDataURL(qrData);
      res.json({ qr: qrImage, appointment_id: apt.appointment_id, token_number: apt.token_number });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code.' });
    }
  });

  // GET /api/appointments/doctors/available
  router.get('/doctors/available', authenticateToken, (req, res) => {
    try {
      const { date, specialty, facility_id, home_visit } = req.query;
      let query = `
        SELECT d.*, f.name as facility_name, f.readiness_score, f.lat, f.lng,
               COUNT(da.id) as available_slots
        FROM doctors d
        JOIN facilities f ON d.facility_id = f.facility_id
        LEFT JOIN doctor_availability da ON d.doctor_id = da.doctor_id AND da.status = 'available'
      `;
      const params = [];
      const conditions = ['d.status = ?'];
      params.push('available');

      if (date) { conditions.push('da.date = ?'); params.push(date); }
      if (specialty) { conditions.push("(d.specialty = ? OR d.specialty LIKE '%General%')"); params.push(specialty); }
      if (facility_id) { conditions.push('d.facility_id = ?'); params.push(facility_id); }
      if (home_visit) { conditions.push('d.home_visit = 1'); }

      query += ' WHERE ' + conditions.join(' AND ') + ' GROUP BY d.doctor_id';
      const doctors = db.prepare(query).all(...params);
      res.json(doctors);
    } catch (err) {
      console.error('Available doctors error:', err);
      res.status(500).json({ error: 'Failed to fetch available doctors.' });
    }
  });

  // GET /api/appointments/slots/:doctorId/:date
  router.get('/slots/:doctorId/:date', authenticateToken, (req, res) => {
    try {
      const slots = db.prepare('SELECT * FROM doctor_availability WHERE doctor_id = ? AND date = ? ORDER BY slot ASC').all(req.params.doctorId, req.params.date);
      res.json(slots);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch slots.' });
    }
  });

  // POST /api/appointments/roster-upload
  router.post('/roster-upload', authenticateToken, (req, res) => {
    try {
      const roster = req.body.data;
      if (!roster || !Array.isArray(roster)) return res.status(400).json({ error: 'Invalid roster data' });

      const facility_id = req.user.facility_id;
      if (!facility_id) return res.status(403).json({ error: 'Only facility staff can upload rosters.' });

      const { v4: uuidv4 } = require('uuid');

      const insertDoctor = db.prepare(`INSERT OR IGNORE INTO doctors (doctor_id, facility_id, name, specialty, status, home_visit) VALUES (?, ?, ?, ?, ?, ?);`);
      const updateDoctor = db.prepare(`UPDATE doctors SET name=?, specialty=? WHERE doctor_id=?`);
      const deleteAvailability = db.prepare(`DELETE FROM doctor_availability WHERE doctor_id = ? AND date = ? AND slot = ?`);
      const insertAvailability = db.prepare(`INSERT INTO doctor_availability (id, doctor_id, facility_id, date, slot, status) VALUES (?, ?, ?, ?, ?, ?)`);

      db.transaction(() => {
        for (const row of roster) {
          if (!row.Doctor_ID || !row.Date || !row.Slot_Time) continue;
          
          // UPSERT pattern for Doctor
          insertDoctor.run(row.Doctor_ID, facility_id, row.Doctor_Name || 'Unknown Doctor', row.Specialty || 'General', 'available', 1);
          updateDoctor.run(row.Doctor_Name || 'Unknown Doctor', row.Specialty || 'General', row.Doctor_ID);
          
          // Availability Slot Merge
          deleteAvailability.run(row.Doctor_ID, row.Date, row.Slot_Time);
          insertAvailability.run(uuidv4(), row.Doctor_ID, facility_id, row.Date, row.Slot_Time, row.Status?.toLowerCase() || 'available');
        }
      })();

      res.json({ message: 'Roster dynamically updated', rowsProcessed: roster.length });
    } catch (err) {
      console.error('Roster error:', err);
      res.status(500).json({ error: 'Failed to process Roster DB upload.' });
    }
  });

  return router;
};
