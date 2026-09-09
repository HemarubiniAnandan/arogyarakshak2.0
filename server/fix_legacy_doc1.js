const db = require('better-sqlite3')('db/aarogya.db');

// The legacy user ID that couldn't see appointments
const docUserId = 'USER-DOCT-1cf9528a';

// 1. Ensure this ID exists in the `doctors` table so foreign keys pass!
db.prepare(`
  INSERT OR IGNORE INTO doctors (doctor_id, facility_id, name, specialty, status, phone, home_visit)
  VALUES (?, 'FAC-DEMO-002', 'Dr. doc1 (Legacy)', 'General Medicine', 'available', '76789765443', 1)
`).run(docUserId);

// 2. Insert the appointment for this doctor
db.prepare(`
  INSERT OR IGNORE INTO appointments (appointment_id, patient_id, doctor_id, facility_id, date, time, status, booked_by, token_number, symptoms, triage_pathway, triage_risk) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'APT-MOCK-LEGACY', 'PAT-MOCK-99', docUserId, 'FAC-DEMO-002', '2026-09-07', '11:15', 'in_progress', 'patient', 108, 'Requires legacy mapping check', 'General Medicine', 'Medium'
);

console.log('Legacy doctor mapping injected successfully');
