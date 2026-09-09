// SYNTHETIC DEMO DATA — no real persons, no real facility identifiers.
// This file populates the AarogyaRakshak database with fictional test data.

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'aarogya.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Remove existing DB for clean seed
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing database.');
}

const db = new Database(DB_PATH);

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('Schema created successfully.');

// Helper
const id = () => uuidv4();
const hash = (pw) => bcrypt.hashSync(pw, 10);

// ============================================================
// FACILITIES (3)
// ============================================================
const facilities = [
  { facility_id: 'FAC-DEMO-001', name: 'Primary Health Centre, Karad', type: 'PHC', lat: 17.2860, lng: 74.1833, readiness_score: 8.5, emergency_accepted: 1, bed_count: 20, staff_count: 12 },
  { facility_id: 'FAC-DEMO-002', name: 'Sub-District Hospital, Satara', type: 'SDH', lat: 17.6805, lng: 74.0183, readiness_score: 7.2, emergency_accepted: 1, bed_count: 50, staff_count: 35 },
  { facility_id: 'FAC-DEMO-003', name: 'Rural Hospital, Wai', type: 'RH', lat: 17.9527, lng: 73.8903, readiness_score: 6.0, emergency_accepted: 0, bed_count: 15, staff_count: 8 },
];

const insertFacility = db.prepare(`INSERT INTO facilities (facility_id, name, type, lat, lng, readiness_score, emergency_accepted, bed_count, staff_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const f of facilities) {
  insertFacility.run(f.facility_id, f.name, f.type, f.lat, f.lng, f.readiness_score, f.emergency_accepted, f.bed_count, f.staff_count);
}
console.log(`Inserted ${facilities.length} facilities.`);

// ============================================================
// DOCTORS (5)
// ============================================================
const doctors = [];

const insertDoctor = db.prepare(`INSERT INTO doctors (doctor_id, facility_id, name, specialty, phone, status, blood_group, years_experience, home_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const d of doctors) {
  insertDoctor.run(d.doctor_id, d.facility_id, d.name, d.specialty, d.phone, d.status, d.blood_group, d.years_experience, d.home_visit);
}
console.log(`Inserted ${doctors.length} doctors.`);

// ============================================================
// DOCTOR AVAILABILITY (slots for next 7 days)
// ============================================================
const insertSlot = db.prepare(`INSERT INTO doctor_availability (id, doctor_id, facility_id, date, slot, status) VALUES (?, ?, ?, ?, ?, ?)`);
const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];
const today = new Date();
for (const doc of doctors) {
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    for (const slot of slots) {
      insertSlot.run(id(), doc.doctor_id, doc.facility_id, dateStr, slot, 'available');
    }
  }
}
console.log('Inserted doctor availability slots.');

// ============================================================
// USERS (one per role + doctors + asha)
// ============================================================
const users = [];

const insertUser = db.prepare(`INSERT INTO users (user_id, role, name, email, phone, password_hash, facility_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const u of users) {
  insertUser.run(u.user_id, u.role, u.name, u.email, u.phone, u.password_hash, u.facility_id);
}
console.log(`Inserted ${users.length} users.`);

// ============================================================
// PATIENTS (15 across pregnancy/child/chronic)
// ============================================================
const patients = [];

const insertPatient = db.prepare(`INSERT INTO patients (patient_id, abha_id, name, phone, village, language, communication_preference, asha_id, preferred_facility, address, blood_group, age, dob, guardian_name, guardian_contact, chronic_conditions, allergies, past_medications, disability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const p of patients) {
  insertPatient.run(p.patient_id, p.abha_id, p.name, p.phone, p.village, p.language, p.communication_preference, p.asha_id, p.preferred_facility, p.address, p.blood_group, p.age, p.dob, p.guardian_name, p.guardian_contact, p.chronic_conditions, p.allergies, p.past_medications, p.disability);
}
console.log(`Inserted ${patients.length} patients.`);

// ============================================================
// PREGNANCY RECORDS
// ============================================================
const pregnancies = [];

const insertPregnancy = db.prepare(`INSERT INTO pregnancy (id, patient_id, rch_id, lmp_date, edd, anc_visit_no, gestational_week, risk_flags, next_visit_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const p of pregnancies) {
  insertPregnancy.run(p.id, p.patient_id, p.rch_id, p.lmp_date, p.edd, p.anc_visit_no, p.gestational_week, p.risk_flags, p.next_visit_due);
}
console.log(`Inserted ${pregnancies.length} pregnancy records.`);

// ============================================================
// CHILD RECORDS
// ============================================================
const children = [];

const insertChild = db.prepare(`INSERT INTO child (beneficiary_id, patient_id, dob, vaccine_due, uwin_sync_status, reminder_status) VALUES (?, ?, ?, ?, ?, ?)`);
for (const c of children) {
  insertChild.run(c.beneficiary_id, c.patient_id, c.dob, c.vaccine_due, c.uwin_sync_status, c.reminder_status);
}
console.log(`Inserted ${children.length} child records.`);

// ============================================================
// CHRONIC CASE RECORDS
// ============================================================
const chronicCases = [];

const insertChronic = db.prepare(`INSERT INTO chronic_case (id, patient_id, condition, reading_value, reading_date, threshold_breached, adherence_gap_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const c of chronicCases) {
  insertChronic.run(c.id, c.patient_id, c.condition, c.reading_value, c.reading_date, c.threshold_breached, c.adherence_gap_count);
}
console.log(`Inserted ${chronicCases.length} chronic case records.`);

// ============================================================
// STOCK
// ============================================================
const stockItems = [];

const insertStock = db.prepare(`INSERT INTO stock (id, facility_id, medicine_name, quantity, quantity_status, updated_by) VALUES (?, ?, ?, ?, ?, ?)`);
for (const s of stockItems) {
  insertStock.run(s.id, s.facility_id, s.medicine_name, s.quantity, s.quantity_status, s.updated_by);
}
console.log(`Inserted ${stockItems.length} stock items.`);

// ============================================================
// SAMPLE APPOINTMENTS
// ============================================================
const appointments = [];

const insertAppointment = db.prepare(`INSERT INTO appointments (appointment_id, patient_id, doctor_id, facility_id, date, time, status, booked_by, token_number, visit_type, symptoms, triage_pathway) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const a of appointments) {
  insertAppointment.run(a.appointment_id, a.patient_id, a.doctor_id, a.facility_id, a.date, a.time, a.status, a.booked_by, a.token_number, a.visit_type, a.symptoms, a.triage_pathway);
}
console.log(`Inserted ${appointments.length} appointments.`);

// ============================================================
// REFERRALS
// ============================================================
const referrals = [];

const insertReferral = db.prepare(`INSERT INTO referrals (referral_id, patient_id, pathway, status, from_facility, to_facility, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const r of referrals) {
  insertReferral.run(r.referral_id, r.patient_id, r.pathway, r.status, r.from_facility, r.to_facility, r.reason);
}
console.log(`Inserted ${referrals.length} referrals.`);

// ============================================================
// PRIORITY FLAGS
// ============================================================
const priorityFlags = [];

const insertPriorityFlag = db.prepare(`INSERT INTO priority_flags (id, patient_id, category, reason_label, raised_at, resolved_status) VALUES (?, ?, ?, ?, ?, ?)`);
for (const pf of priorityFlags) {
  insertPriorityFlag.run(pf.id, pf.patient_id, pf.category, pf.reason_label, pf.raised_at, pf.resolved_status);
}
console.log(`Inserted ${priorityFlags.length} priority flags.`);

// ============================================================
// REMINDERS
// ============================================================
const reminders = [];

const insertReminder = db.prepare(`INSERT INTO reminders (id, patient_id, event_type, scheduled_time, channel, delivery_status) VALUES (?, ?, ?, ?, ?, ?)`);
for (const r of reminders) {
  insertReminder.run(r.id, r.patient_id, r.event_type, r.scheduled_time, r.channel, r.delivery_status);
}
console.log(`Inserted ${reminders.length} reminders.`);

// ============================================================
// VERIFY
// ============================================================
console.log('\n--- VERIFICATION ---');
const tables = ['users', 'patients', 'pregnancy', 'child', 'chronic_case', 'facilities', 'doctors', 'doctor_availability', 'appointments', 'stock', 'reminders', 'referrals', 'priority_flags', 'audit_log', 'sync_log'];
for (const table of tables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  console.log(`  ${table}: ${count.c} rows`);
}

db.close();
console.log('\nSeed complete. Database saved to:', DB_PATH);
