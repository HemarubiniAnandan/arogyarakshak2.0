const db = require('better-sqlite3')('db/aarogya.db');
const uuid = require('crypto').randomUUID;

// 1. Create a Mock Patient so foreign key constraints pass
db.prepare(`
  INSERT OR IGNORE INTO patients (patient_id, name, phone, village, language, blood_group, age, chronic_conditions, disability)
  VALUES ('PAT-MOCK-99', 'Ramesh (Mock Patient)', '9999999999', 'Satara', 'mr', 'O+', 45, 'Hypertension', 'None')
`).run();

const docs = db.prepare('SELECT doctor_id FROM doctors').all();
console.log('Doctors found:', docs.length);

docs.forEach(doc => {
  const aptId = 'APT-MOCK-' + Math.floor(Math.random()*10000);
  
  db.prepare(`
    INSERT OR IGNORE INTO appointments (appointment_id, patient_id, doctor_id, facility_id, date, time, status, booked_by, token_number, symptoms, triage_pathway, triage_risk) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    aptId, 'PAT-MOCK-99', doc.doctor_id, 'FAC-DEMO-001', '2026-09-07', '10:30', 'in_progress', 'patient', 101, 'Mild fever and cough', 'General Medicine', 'Low'
  );
});

// Seed Pharmacy Stock
const meds = ['Paracetamol', 'Amoxicillin', 'Insulin', 'Metformin'];
meds.forEach(med => {
  db.prepare('INSERT OR IGNORE INTO stock (id, facility_id, medicine_name, quantity, quantity_status, updated_by) VALUES (?, ?, ?, ?, ?, ?)').run(uuid(), 'FAC-DEMO-001', med, 500, 'available', 'SYS');
});

console.log('Seed DB Successful');
