const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = function(db) {
  // GET /api/patients — list (ASHA sees assigned, staff/admin sees all)
  router.get('/', authenticateToken, (req, res) => {
    try {
      let patients;
      if (req.user.role === 'asha') {
        patients = db.prepare('SELECT * FROM patients WHERE asha_id = ?').all(req.user.user_id);
      } else if (req.user.role === 'patient') {
        patients = db.prepare('SELECT * FROM patients WHERE patient_id = (SELECT patient_id FROM patients WHERE phone = (SELECT phone FROM users WHERE user_id = ?) LIMIT 1)').all(req.user.user_id);
      } else {
        const { village, search } = req.query;
        if (search) {
          patients = db.prepare('SELECT * FROM patients WHERE name LIKE ? OR patient_id LIKE ? OR phone LIKE ?').all(`%${search}%`, `%${search}%`, `%${search}%`);
        } else if (village) {
          patients = db.prepare('SELECT * FROM patients WHERE village = ?').all(village);
        } else {
          patients = db.prepare('SELECT * FROM patients').all();
        }
      }
      res.json(patients);
    } catch (err) {
      console.error('Patients list error:', err);
      res.status(500).json({ error: 'Failed to fetch patients.' });
    }
  });

  // GET /api/patients/:id
  router.get('/:id', authenticateToken, (req, res) => {
    try {
      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(req.params.id);
      if (!patient) return res.status(404).json({ error: 'Patient not found.' });

      // Include sub-records
      const pregnancy = db.prepare('SELECT * FROM pregnancy WHERE patient_id = ?').all(req.params.id);
      const children = db.prepare('SELECT * FROM child WHERE patient_id = ?').all(req.params.id);
      const chronic = db.prepare('SELECT * FROM chronic_case WHERE patient_id = ?').all(req.params.id);
      const appointments = db.prepare('SELECT a.*, d.name as doctor_name, f.name as facility_name FROM appointments a LEFT JOIN doctors d ON a.doctor_id = d.doctor_id LEFT JOIN facilities f ON a.facility_id = f.facility_id WHERE a.patient_id = ? ORDER BY a.date DESC').all(req.params.id);
      const referrals = db.prepare('SELECT * FROM referrals WHERE patient_id = ?').all(req.params.id);
      const priorityFlags = db.prepare('SELECT * FROM priority_flags WHERE patient_id = ?').all(req.params.id);

      res.json({ ...patient, pregnancy, children, chronic, appointments, referrals, priorityFlags });
    } catch (err) {
      console.error('Patient detail error:', err);
      res.status(500).json({ error: 'Failed to fetch patient.' });
    }
  });

  // POST /api/patients
  router.post('/', authenticateToken, authorizeRoles('asha', 'facility_staff', 'doctor'), (req, res) => {
    try {
      const { name, phone, village, language, communication_preference, preferred_facility, address, blood_group, age, dob, guardian_name, guardian_contact, chronic_conditions, allergies, past_medications, disability } = req.body;
      if (!name) return res.status(400).json({ error: 'Patient name is required.' });

      const patient_id = `PATIENT-DEMO-${uuidv4().slice(0, 6).toUpperCase()}`;
      const abha_id = `ABHA-SYNTH-${uuidv4().slice(0, 6).toUpperCase()}`;

      db.prepare(`INSERT INTO patients (patient_id, abha_id, name, phone, village, language, communication_preference, asha_id, preferred_facility, address, blood_group, age, dob, guardian_name, guardian_contact, chronic_conditions, allergies, past_medications, disability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        patient_id, abha_id, name, phone || null, village || null, language || 'hi', communication_preference || 'sms', req.user.user_id, preferred_facility || null, address || null, blood_group || null, age || null, dob || null, guardian_name || null, guardian_contact || null, chronic_conditions || null, allergies || null, past_medications || null, disability || null
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'patient', patient_id, 'create', req.user.user_id, 'New patient registration'
      );

      res.status(201).json({ patient_id, abha_id, name });
    } catch (err) {
      console.error('Patient create error:', err);
      res.status(500).json({ error: 'Failed to create patient.' });
    }
  });

  // PUT /api/patients/:id
  router.put('/:id', authenticateToken, authorizeRoles('asha', 'facility_staff', 'doctor'), (req, res) => {
    try {
      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(req.params.id);
      if (!patient) return res.status(404).json({ error: 'Patient not found.' });

      const fields = ['name', 'phone', 'village', 'language', 'communication_preference', 'preferred_facility', 'address', 'blood_group', 'age', 'dob', 'guardian_name', 'guardian_contact', 'chronic_conditions', 'allergies', 'past_medications', 'disability'];
      const updates = [];
      const values = [];
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

      values.push(req.params.id);
      db.prepare(`UPDATE patients SET ${updates.join(', ')} WHERE patient_id = ?`).run(...values);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'patient', req.params.id, 'update', req.user.user_id, `Updated fields: ${updates.map(u => u.split(' ')[0]).join(', ')}`
      );

      res.json({ message: 'Patient updated.', patient_id: req.params.id });
    } catch (err) {
      console.error('Patient update error:', err);
      res.status(500).json({ error: 'Failed to update patient.' });
    }
  });

  return router;
};
