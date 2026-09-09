const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const uwinAdapter = require('../adapters/uwinAdapter');

module.exports = function(db) {
  // GET /api/child/:patientId
  router.get('/:patientId', authenticateToken, (req, res) => {
    try {
      const records = db.prepare('SELECT * FROM child WHERE patient_id = ?').all(req.params.patientId);
      // Enrich with U-WIN adapter data
      const enriched = records.map(r => ({
        ...r,
        uwin_data: uwinAdapter.getDueList(r.beneficiary_id),
      }));
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch child records.' });
    }
  });

  // POST /api/child
  router.post('/', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { patient_id, dob, vaccine_due } = req.body;
      if (!patient_id || !dob) return res.status(400).json({ error: 'patient_id and dob are required.' });

      const beneficiary_id = `CHILD-DEMO-${uuidv4().slice(0,6).toUpperCase()}`;

      db.prepare('INSERT INTO child (beneficiary_id, patient_id, dob, vaccine_due) VALUES (?, ?, ?, ?)').run(
        beneficiary_id, patient_id, dob, vaccine_due || null
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'child', beneficiary_id, 'create', req.user.user_id, `Child beneficiary registered, DOB: ${dob}`
      );

      res.status(201).json({ beneficiary_id, patient_id, dob });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create child record.' });
    }
  });

  // GET /api/child/vaccine/schedule
  router.get('/vaccine/schedule', authenticateToken, (req, res) => {
    res.json(uwinAdapter.getVaccineSchedule());
  });

  // PUT /api/child/:beneficiaryId/vaccinate
  router.put('/:beneficiaryId/vaccinate', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { vaccine_given } = req.body;
      const record = db.prepare('SELECT * FROM child WHERE beneficiary_id = ?').get(req.params.beneficiaryId);
      if (!record) return res.status(404).json({ error: 'Child record not found.' });

      // Remove given vaccine from due list
      const currentDue = record.vaccine_due ? record.vaccine_due.split(',') : [];
      const updatedDue = currentDue.filter(v => v.trim() !== vaccine_given).join(',');

      db.prepare("UPDATE child SET vaccine_due = ?, uwin_sync_status = 'pending' WHERE beneficiary_id = ?").run(
        updatedDue, req.params.beneficiaryId
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'child', req.params.beneficiaryId, 'vaccinate', req.user.user_id, `Vaccine administered: ${vaccine_given}`
      );

      res.json({ message: `Vaccine ${vaccine_given} recorded.`, remaining_due: updatedDue });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update vaccination record.' });
    }
  });

  return router;
};
