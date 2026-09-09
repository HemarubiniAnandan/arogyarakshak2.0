const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/auth');

module.exports = function(db) {
  // POST /api/auth/login
  router.post('/login', (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      let user;
      if (role) {
        user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, role);
      } else {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const validPassword = bcrypt.compareSync(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { user_id: user.user_id, role: user.role, name: user.name, facility_id: user.facility_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log login
      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'user', user.user_id, 'login', user.user_id, `Login as ${user.role}`
      );

      res.json({
        token,
        user: {
          user_id: user.user_id,
          role: user.role,
          name: user.name,
          email: user.email,
          phone: user.phone,
          facility_id: user.facility_id,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login.' });
    }
  });

  // GET /api/auth/facilities/:id/doctors (Public list for registry claiming)
  router.get('/facilities/:id/doctors', (req, res) => {
    try {
      const doctors = db.prepare('SELECT doctor_id, name, specialty FROM doctors WHERE facility_id = ?').all(req.params.id);
      res.json(doctors);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch facility doctors.' });
    }
  });

  // POST /api/auth/register
  router.post('/register', (req, res) => {
    try {
      const {
        name, email, password, phone, role, facility_id,
        license_no, specialty, asha_gov_id, employee_id,
        age, dob, village, address, blood_group, chronic_conditions, allergies, past_medications, disability
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required.' });
      }

      const validRoles = ['patient', 'asha', 'doctor', 'facility_staff', 'pharmacy', 'district_official'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }

      const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'Email address already registered.' });
      }

      let user_id;
      if (role === 'doctor' && req.body.doctor_id) {
        user_id = req.body.doctor_id;
      } else {
        user_id = `USER-${role.toUpperCase().slice(0, 4)}-${uuidv4().slice(0, 8)}`;
      }
      
      const password_hash = bcrypt.hashSync(password, 10);

      db.prepare('INSERT INTO users (user_id, role, name, email, phone, password_hash, facility_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        user_id, role, name, email, phone || null, password_hash, facility_id || null
      );

      // Role-specific record creation
      if (role === 'patient') {
        const patient_id = `PATIENT-${uuidv4().slice(0, 6).toUpperCase()}`;
        const abha_id = `ABHA-NHA-${uuidv4().slice(0, 8).toUpperCase()}`;
        
        db.prepare(`
          INSERT INTO patients (patient_id, abha_id, name, phone, village, address, blood_group, age, dob, chronic_conditions, allergies, past_medications, disability, communication_preference)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          patient_id, abha_id, name, phone || null, village || 'Satara', address || null, blood_group || 'O+', age || null, dob || null, chronic_conditions || null, allergies || null, past_medications || null, disability || null, 'sms'
        );
      } else if (role === 'doctor') {
        if (!req.body.doctor_id) {
          const doctor_id = `DOC-${uuidv4().slice(0, 6).toUpperCase()}`;
          db.prepare(`
            INSERT INTO doctors (doctor_id, name, specialty, facility_id, status, phone, home_visit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            doctor_id, name, specialty || 'General Medicine', facility_id || 'FAC-DEMO-001', 'available', phone || null, 1
          );
        } else {
          // Doctor claimed their uploaded roster identity. Just update missing fields if any.
          db.prepare(`UPDATE doctors SET phone = ? WHERE doctor_id = ?`).run(phone || null, req.body.doctor_id);
        }
      }

      const token = jwt.sign(
        { user_id, role, name, facility_id: facility_id || null },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'user', user_id, 'register', user_id, `New ${role} registration (${name})`
      );

      res.status(201).json({
        token,
        user: { user_id, role, name, email, phone, facility_id },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration.' });
    }
  });

  // GET /api/auth/me
  const { authenticateToken } = require('../middleware/auth');
  router.get('/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT user_id, role, name, email, phone, facility_id FROM users WHERE user_id = ?').get(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    let profileData = {};
    if (user.role === 'patient') {
      const p = db.prepare('SELECT * FROM patients WHERE phone = ? OR name = ?').get(user.phone, user.name);
      if (p) profileData = { patient_profile: p };
    }

    res.json({ ...user, ...profileData });
  });

  return router;
};

