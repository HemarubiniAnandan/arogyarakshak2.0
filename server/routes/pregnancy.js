const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = function(db) {
  // GET /api/pregnancy/:patientId
  router.get('/:patientId', authenticateToken, (req, res) => {
    try {
      const records = db.prepare('SELECT * FROM pregnancy WHERE patient_id = ?').all(req.params.patientId);
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch pregnancy records.' });
    }
  });

  // POST /api/pregnancy
  router.post('/', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { patient_id, rch_id, lmp_date, edd, risk_flags } = req.body;
      if (!patient_id || !lmp_date) return res.status(400).json({ error: 'patient_id and lmp_date are required.' });

      const id = uuidv4();
      const calculatedEdd = edd || calculateEDD(lmp_date);
      const gestationalWeek = calculateGestationalWeek(lmp_date);

      db.prepare('INSERT INTO pregnancy (id, patient_id, rch_id, lmp_date, edd, anc_visit_no, gestational_week, risk_flags, next_visit_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, patient_id, rch_id || `RCH-SYNTH-${uuidv4().slice(0,6)}`, lmp_date, calculatedEdd, 0, gestationalWeek, risk_flags || null, calculateNextVisit(gestationalWeek)
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'pregnancy', id, 'create', req.user.user_id, `Pregnancy registered, LMP: ${lmp_date}`
      );

      // Auto-create priority flag if risk flags exist
      if (risk_flags) {
        db.prepare("INSERT INTO priority_flags (id, patient_id, category, reason_label, raised_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
          uuidv4(), patient_id, 'maternal', `High-risk ANC — ${risk_flags}`
        );
      }

      res.status(201).json({ id, patient_id, edd: calculatedEdd, gestational_week: gestationalWeek });
    } catch (err) {
      console.error('Pregnancy create error:', err);
      res.status(500).json({ error: 'Failed to create pregnancy record.' });
    }
  });

  // PUT /api/pregnancy/:id/visit
  router.put('/:id/visit', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const record = db.prepare('SELECT * FROM pregnancy WHERE id = ?').get(req.params.id);
      if (!record) return res.status(404).json({ error: 'Pregnancy record not found.' });

      const newVisitNo = (record.anc_visit_no || 0) + 1;
      const gestWeek = calculateGestationalWeek(record.lmp_date);
      const nextVisit = calculateNextVisit(gestWeek);
      const risk_flags = req.body.risk_flags || record.risk_flags;

      db.prepare('UPDATE pregnancy SET anc_visit_no = ?, gestational_week = ?, risk_flags = ?, next_visit_due = ? WHERE id = ?').run(
        newVisitNo, gestWeek, risk_flags, nextVisit, req.params.id
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'pregnancy', req.params.id, 'anc_visit', req.user.user_id, `ANC visit #${newVisitNo} completed`
      );

      res.json({ message: `ANC visit #${newVisitNo} recorded.`, next_visit_due: nextVisit });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update pregnancy record.' });
    }
  });

  return router;
};

function calculateEDD(lmpDate) {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split('T')[0];
}

function calculateGestationalWeek(lmpDate) {
  const lmp = new Date(lmpDate);
  const now = new Date();
  return Math.floor((now - lmp) / (7 * 24 * 60 * 60 * 1000));
}

function calculateNextVisit(gestationalWeek) {
  const now = new Date();
  let weeksAhead = 4;
  if (gestationalWeek > 28) weeksAhead = 2;
  if (gestationalWeek > 36) weeksAhead = 1;
  now.setDate(now.getDate() + (weeksAhead * 7));
  return now.toISOString().split('T')[0];
}
