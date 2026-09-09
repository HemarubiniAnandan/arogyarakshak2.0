const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = function(db) {
  // GET /api/referrals
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { pathway, status, patient_id } = req.query;
      let query = 'SELECT r.*, p.name as patient_name, ff.name as from_facility_name, tf.name as to_facility_name FROM referrals r LEFT JOIN patients p ON r.patient_id = p.patient_id LEFT JOIN facilities ff ON r.from_facility = ff.facility_id LEFT JOIN facilities tf ON r.to_facility = tf.facility_id WHERE 1=1';
      const params = [];
      if (pathway) { query += ' AND r.pathway = ?'; params.push(pathway); }
      if (status) { query += ' AND r.status = ?'; params.push(status); }
      if (patient_id) { query += ' AND r.patient_id = ?'; params.push(patient_id); }
      query += ' ORDER BY r.updated_at DESC';
      res.json(db.prepare(query).all(...params));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch referrals.' });
    }
  });

  // POST /api/referrals
  router.post('/', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { patient_id, pathway, from_facility, to_facility, reason } = req.body;
      if (!patient_id || !pathway) return res.status(400).json({ error: 'patient_id and pathway required.' });

      const referral_id = `REF-${uuidv4().slice(0,8).toUpperCase()}`;
      db.prepare('INSERT INTO referrals (referral_id, patient_id, pathway, status, from_facility, to_facility, reason) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        referral_id, patient_id, pathway, 'created', from_facility || null, to_facility || null, reason || null
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'referral', referral_id, 'create', req.user.user_id, `Referral created: ${pathway} — ${reason || 'No reason'}`
      );

      res.status(201).json({ referral_id, status: 'created' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create referral.' });
    }
  });

  // PUT /api/referrals/:id/status
  router.put('/:id/status', authenticateToken, (req, res) => {
    try {
      const { status, reason } = req.body;
      const validStatuses = ['created', 'accepted', 'arrived', 'care_given', 'rejected'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });

      const ref = db.prepare('SELECT * FROM referrals WHERE referral_id = ?').get(req.params.id);
      if (!ref) return res.status(404).json({ error: 'Referral not found.' });

      db.prepare("UPDATE referrals SET status = ?, updated_at = datetime('now'), sync_version = sync_version + 1 WHERE referral_id = ?").run(status, req.params.id);

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'referral', req.params.id, 'status_change', req.user.user_id, `Status: ${ref.status} → ${status}${reason ? ` — ${reason}` : ''}`
      );

      res.json({ message: 'Referral status updated.', referral_id: req.params.id, status });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update referral.' });
    }
  });

  // GET /api/referrals/stats/funnel
  router.get('/stats/funnel', authenticateToken, (req, res) => {
    try {
      const { pathway } = req.query;
      let baseQuery = 'SELECT status, COUNT(*) as count FROM referrals';
      const params = [];
      if (pathway) { baseQuery += ' WHERE pathway = ?'; params.push(pathway); }
      baseQuery += ' GROUP BY status';

      const rows = db.prepare(baseQuery).all(...params);
      const counts = { created: 0, accepted: 0, arrived: 0, care_given: 0 };
      for (const row of rows) {
        if (counts.hasOwnProperty(row.status)) counts[row.status] = row.count;
      }

      const total = counts.created + counts.accepted + counts.arrived + counts.care_given;
      const conversions = {
        created_to_accepted: total > 0 ? Math.round((counts.accepted + counts.arrived + counts.care_given) / total * 100) : 0,
        accepted_to_arrived: (counts.accepted + counts.arrived + counts.care_given) > 0 ? Math.round((counts.arrived + counts.care_given) / (counts.accepted + counts.arrived + counts.care_given) * 100) : 0,
        arrived_to_care_given: (counts.arrived + counts.care_given) > 0 ? Math.round(counts.care_given / (counts.arrived + counts.care_given) * 100) : 0,
      };

      // Get pathway breakdown
      const pathwayBreakdown = db.prepare('SELECT pathway, status, COUNT(*) as count FROM referrals GROUP BY pathway, status').all();

      res.json({ funnel: counts, conversions, total, pathway_breakdown: pathwayBreakdown });
    } catch (err) {
      res.status(500).json({ error: 'Failed to compute funnel stats.' });
    }
  });

  return router;
};
