const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = function(db, notificationService) {
  // GET /api/reminders
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { patient_id, status } = req.query;
      let query = 'SELECT r.*, p.name as patient_name, p.phone as patient_phone FROM reminders r LEFT JOIN patients p ON r.patient_id = p.patient_id WHERE 1=1';
      const params = [];

      if (patient_id) { query += ' AND r.patient_id = ?'; params.push(patient_id); }
      if (status) { query += ' AND r.delivery_status = ?'; params.push(status); }

      query += ' ORDER BY r.scheduled_time DESC';
      res.json(db.prepare(query).all(...params));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch reminders.' });
    }
  });

  // POST /api/reminders — manual schedule
  router.post('/', authenticateToken, authorizeRoles('asha', 'doctor', 'facility_staff'), (req, res) => {
    try {
      const { patient_id, event_type, scheduled_time, channel } = req.body;
      if (!patient_id || !event_type) return res.status(400).json({ error: 'patient_id and event_type are required.' });

      const id = uuidv4();
      db.prepare('INSERT INTO reminders (id, patient_id, event_type, scheduled_time, channel, delivery_status) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, patient_id, event_type, scheduled_time || new Date().toISOString(), channel || 'sms', 'pending'
      );

      res.status(201).json({ id, status: 'scheduled' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create reminder.' });
    }
  });

  // POST /api/reminders/trigger — trigger pending reminders immediately (demo mode)
  router.post('/trigger', async (req, res) => {
    try {
      const pending = db.prepare("SELECT r.*, p.name as patient_name, p.phone as patient_phone, p.language FROM reminders r LEFT JOIN patients p ON r.patient_id = p.patient_id WHERE r.delivery_status = 'pending'").all();

      const results = [];
      for (const rem of pending) {
        const message = `Namaskar ${rem.patient_name}, AarogyaRakshak reminder: Your ${rem.event_type.replace('_', ' ')} is due. Please visit your PHC.`;
        let notifRes;

        if (rem.channel === 'voice') {
          notifRes = await notificationService.makeVoiceCall(rem.patient_phone || '+919876500000', message, rem.language === 'mr' ? 'hi-IN' : 'hi-IN');
        } else {
          notifRes = await notificationService.sendSMS(rem.patient_phone || '+919876500000', message);
        }

        if (notifRes.success) {
          db.prepare("UPDATE reminders SET delivery_status = 'sent' WHERE id = ?").run(rem.id);
          results.push({ id: rem.id, status: 'sent', mode: notifRes.mode });
        } else {
          // Failure escalation ladder: retry_count ++
          const newRetry = (rem.retry_count || 0) + 1;
          if (newRetry >= 2) {
            // Failed twice -> create ASHA follow-up task / priority flag!
            db.prepare("UPDATE reminders SET delivery_status = 'failed', retry_count = ? WHERE id = ?").run(newRetry, rem.id);
            db.prepare("INSERT INTO priority_flags (id, patient_id, category, reason_label, raised_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
              uuidv4(), rem.patient_id, 'reminder_failed', `Failed automated ${rem.channel} reminder for ${rem.event_type} (ASHA manual follow-up required)`
            );
            results.push({ id: rem.id, status: 'escalated_to_asha', retry: newRetry });
          } else {
            db.prepare('UPDATE reminders SET retry_count = ? WHERE id = ?').run(newRetry, rem.id);
            results.push({ id: rem.id, status: 'retry_queued', retry: newRetry });
          }
        }
      }

      res.json({ processed: pending.length, results });
    } catch (err) {
      console.error('Trigger reminders error:', err);
      res.status(500).json({ error: 'Failed to process reminders.' });
    }
  });

  return router;
};
