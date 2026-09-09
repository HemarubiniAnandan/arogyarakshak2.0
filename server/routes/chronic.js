const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = function(db) {
  // GET /api/chronic/:patientId
  router.get('/:patientId', authenticateToken, (req, res) => {
    try {
      const records = db.prepare('SELECT * FROM chronic_case WHERE patient_id = ? ORDER BY reading_date DESC').all(req.params.patientId);
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch chronic records.' });
    }
  });

  // POST /api/chronic — add reading
  router.post('/', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { patient_id, condition, reading_value } = req.body;
      if (!patient_id || !condition || reading_value == null) {
        return res.status(400).json({ error: 'patient_id, condition, and reading_value are required.' });
      }

      const id = uuidv4();
      const threshold_breached = checkThreshold(condition, reading_value) ? 1 : 0;

      // Count adherence gaps
      const prevRecord = db.prepare('SELECT * FROM chronic_case WHERE patient_id = ? AND condition = ? ORDER BY reading_date DESC LIMIT 1').get(patient_id, condition);
      let adherence_gap_count = 0;
      if (prevRecord) {
        adherence_gap_count = prevRecord.adherence_gap_count || 0;
        const daysSince = Math.floor((new Date() - new Date(prevRecord.reading_date)) / (1000 * 60 * 60 * 24));
        if (daysSince > 14) adherence_gap_count++;
      }

      db.prepare("INSERT INTO chronic_case (id, patient_id, condition, reading_value, reading_date, threshold_breached, adherence_gap_count) VALUES (?, ?, ?, ?, date('now'), ?, ?)").run(
        id, patient_id, condition, reading_value, threshold_breached, adherence_gap_count
      );

      // Auto-raise priority flag if threshold breached
      if (threshold_breached) {
        db.prepare("INSERT INTO priority_flags (id, patient_id, category, reason_label, raised_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
          uuidv4(), patient_id, 'chronic', `${condition} threshold breached — reading: ${reading_value}`
        );
      }

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'chronic_case', id, 'reading_added', req.user.user_id, `${condition}: ${reading_value}${threshold_breached ? ' (THRESHOLD BREACHED)' : ''}`
      );

      res.status(201).json({ id, threshold_breached: !!threshold_breached, adherence_gap_count });
    } catch (err) {
      console.error('Chronic create error:', err);
      res.status(500).json({ error: 'Failed to add chronic reading.' });
    }
  });

  // GET /api/chronic/trend/:patientId/:condition
  router.get('/trend/:patientId/:condition', authenticateToken, (req, res) => {
    try {
      const records = db.prepare('SELECT reading_value, reading_date FROM chronic_case WHERE patient_id = ? AND condition = ? ORDER BY reading_date ASC').all(req.params.patientId, req.params.condition);
      const thresholds = getThresholds(req.params.condition);
      res.json({ records, thresholds });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trend data.' });
    }
  });

  return router;
};

function checkThreshold(condition, value) {
  const thresholds = {
    'Hypertension': { max: 140 },
    'Type 2 Diabetes': { max: 200 },
    'Asthma': { min: 60 },
    'COPD': { min: 60 },
    'Hypothyroidism': { max: 5.5 },
  };
  const t = thresholds[condition];
  if (!t) return false;
  if (t.max && value > t.max) return true;
  if (t.min && value < t.min) return true;
  return false;
}

function getThresholds(condition) {
  const thresholds = {
    'Hypertension': { label: 'Systolic BP', unit: 'mmHg', normal_max: 140, danger: 180 },
    'Type 2 Diabetes': { label: 'Fasting Blood Sugar', unit: 'mg/dL', normal_max: 126, danger: 250 },
    'Asthma': { label: 'Peak Flow', unit: '% predicted', normal_min: 80, danger_min: 50 },
    'COPD': { label: 'SpO2', unit: '%', normal_min: 92, danger_min: 85 },
    'Hypothyroidism': { label: 'TSH', unit: 'mIU/L', normal_max: 4.5, danger: 10 },
  };
  return thresholds[condition] || { label: condition, unit: '', normal_max: null };
}
