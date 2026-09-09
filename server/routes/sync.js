const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

module.exports = function(db) {
  // POST /api/sync — handle background offline sync queue
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items array is required.' });
      }

      const results = [];

      db.transaction(() => {
        for (const item of items) {
          const { table_name, record_id, action, data, client_timestamp } = item;

          if (!table_name || !record_id || !action) {
            results.push({ record_id, status: 'rejected', reason: 'Missing table_name, record_id, or action' });
            continue;
          }

          // Check for existing record to detect conflict
          let serverRecord = null;
          try {
            const pkField = table_name === 'patients' ? 'patient_id' : table_name === 'appointments' ? 'appointment_id' : table_name === 'referrals' ? 'referral_id' : 'id';
            serverRecord = db.prepare(`SELECT * FROM ${table_name} WHERE ${pkField} = ?`).get(record_id);
          } catch (e) {
            // Table or field might not exist
          }

          if (serverRecord && serverRecord.updated_at && client_timestamp) {
            const serverTime = new Date(serverRecord.updated_at).getTime();
            const clientTime = new Date(client_timestamp).getTime();

            // Conflict detection: if server record is newer, reject client write
            if (serverTime > clientTime) {
              const rejectReason = `Server timestamp (${serverRecord.updated_at}) is newer than client timestamp (${client_timestamp}). Last-write-wins rejected client update.`;
              db.prepare('INSERT INTO sync_log (id, table_name, record_id, rejected_reason) VALUES (?, ?, ?, ?)').run(
                uuidv4(), table_name, record_id, rejectReason
              );
              results.push({ record_id, status: 'rejected', reason: rejectReason });
              continue;
            }
          }

          // Process action
          try {
            if (action === 'CREATE' || action === 'INSERT') {
              if (table_name === 'patients') {
                db.prepare(`INSERT INTO patients (patient_id, abha_id, name, phone, village, language, asha_id, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
                  data.patient_id || record_id, data.abha_id || `ABHA-SYNTH-${uuidv4().slice(0,6)}`, data.name, data.phone || null, data.village || null, data.language || 'mr', req.user.user_id, data.address || null
                );
              } else if (table_name === 'appointments') {
                db.prepare(`INSERT INTO appointments (appointment_id, patient_id, doctor_id, facility_id, date, time, status, booked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
                  data.appointment_id || record_id, data.patient_id, data.doctor_id, data.facility_id, data.date, data.time, 'booked', req.user.user_id
                );
              }
              results.push({ record_id, status: 'synced' });
            } else if (action === 'UPDATE') {
              if (table_name === 'patients') {
                db.prepare(`UPDATE patients SET name = ?, phone = ?, village = ? WHERE patient_id = ?`).run(
                  data.name, data.phone, data.village, record_id
                );
              }
              results.push({ record_id, status: 'synced' });
            } else {
              results.push({ record_id, status: 'synced', note: 'Action acknowledged' });
            }

            db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
              uuidv4(), table_name, record_id, `offline_sync_${action.toLowerCase()}`, req.user.user_id, 'Synced from offline queue'
            );
          } catch (err) {
            const errReason = `DB Error during sync: ${err.message}`;
            db.prepare('INSERT INTO sync_log (id, table_name, record_id, rejected_reason) VALUES (?, ?, ?, ?)').run(
              uuidv4(), table_name, record_id, errReason
            );
            results.push({ record_id, status: 'rejected', reason: errReason });
          }
        }
      })();

      res.json({ synced_count: results.filter(r => r.status === 'synced').length, results });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Server error during sync processing.' });
    }
  });

  // GET /api/sync/logs — view rejection audit logs
  router.get('/logs', authenticateToken, (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM sync_log ORDER BY timestamp DESC').all();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch sync logs.' });
    }
  });

  return router;
};
