require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const dbPath = path.join(__dirname, 'db', 'aarogya.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Connected to SQLite database at:', dbPath);

// Initialize notification service
const notificationsModule = require('./routes/notifications')(db);
const notificationService = {
  sendSMS: notificationsModule.sendSMS,
  makeVoiceCall: notificationsModule.makeVoiceCall,
};

// Import and mount routes
const authRoutes = require('./routes/auth')(db);
const patientRoutes = require('./routes/patients')(db);
const pregnancyRoutes = require('./routes/pregnancy')(db);
const childRoutes = require('./routes/child')(db);
const chronicRoutes = require('./routes/chronic')(db);
const appointmentRoutes = require('./routes/appointments')(db);
const referralRoutes = require('./routes/referrals')(db);
const stockRoutes = require('./routes/stock')(db);
const reminderRoutes = require('./routes/reminders')(db, notificationService);
const syncRoutes = require('./routes/sync')(db);
const auxiliaryRoutes = require('./routes/auxiliary')(db, notificationService);

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/child', childRoutes);
app.use('/api/chronic', chronicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationsModule.router);
app.use('/api', auxiliaryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'AarogyaRakshak 2.0',
    problem_statement: '26133 - Govt of Maharashtra',
    timestamp: new Date().toISOString(),
  });
});

// Setup node-cron for accelerated reminder checks (configurable via .env REMINDER_CRON_INTERVAL)
const cronInterval = process.env.REMINDER_CRON_INTERVAL || '*/2 * * * *'; // every 2 mins default
cron.schedule(cronInterval, async () => {
  console.log(`[CRON] Running automated reminder check (${new Date().toISOString()})...`);
  try {
    const dueReminders = db.prepare("SELECT r.*, p.name as patient_name, p.phone as patient_phone FROM reminders r JOIN patients p ON r.patient_id = p.patient_id WHERE r.delivery_status = 'pending' AND datetime(r.scheduled_time) <= datetime('now')").all();
    for (const rem of dueReminders) {
      const msg = `Reminder: Your ${rem.event_type} appointment is due.`;
      const res = rem.channel === 'voice'
        ? await notificationService.makeVoiceCall(rem.patient_phone, msg)
        : await notificationService.sendSMS(rem.patient_phone, msg);
      if (res.success) {
        db.prepare('UPDATE reminders SET delivery_status = "sent" WHERE id = ?').run(rem.id);
      }
    }
  } catch (err) {
    console.error('[CRON] Error checking reminders:', err.message);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` AarogyaRakshak 2.0 Backend Server Running`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Twilio Mode: ${process.env.TWILIO_ACCOUNT_SID ? 'REAL SDK' : 'SIMULATED'}`);
  console.log(`===================================================`);
});
