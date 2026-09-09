-- AarogyaRakshak 2.0 — Database Schema
-- Rural healthcare interoperability prototype for SIH 2026
-- Government of Maharashtra — Problem Statement 26133

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT PRIMARY KEY,
  role          TEXT NOT NULL CHECK(role IN ('patient','asha','doctor','facility_staff','district_official')),
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  facility_id   TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  patient_id              TEXT PRIMARY KEY,
  abha_id                 TEXT,
  name                    TEXT NOT NULL,
  phone                   TEXT,
  village                 TEXT,
  language                TEXT DEFAULT 'hi',
  communication_preference TEXT DEFAULT 'sms',
  asha_id                 TEXT,
  preferred_facility      TEXT,
  address                 TEXT,
  blood_group             TEXT,
  age                     INTEGER,
  dob                     TEXT,
  guardian_name           TEXT,
  guardian_contact        TEXT,
  chronic_conditions      TEXT,
  allergies               TEXT,
  past_medications        TEXT,
  disability              TEXT,
  created_at              TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PREGNANCY TRACKING (RCH / ANC)
-- ============================================================
CREATE TABLE IF NOT EXISTS pregnancy (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL,
  rch_id            TEXT,
  lmp_date          TEXT,
  edd               TEXT,
  anc_visit_no      INTEGER DEFAULT 0,
  gestational_week  INTEGER,
  risk_flags        TEXT,
  next_visit_due    TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- CHILD IMMUNISATION
-- ============================================================
CREATE TABLE IF NOT EXISTS child (
  beneficiary_id    TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL,
  dob               TEXT,
  vaccine_due       TEXT,
  uwin_sync_status  TEXT DEFAULT 'pending',
  reminder_status   TEXT DEFAULT 'none',
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- CHRONIC CARE
-- ============================================================
CREATE TABLE IF NOT EXISTS chronic_case (
  id                    TEXT PRIMARY KEY,
  patient_id            TEXT NOT NULL,
  condition             TEXT NOT NULL,
  reading_value         REAL,
  reading_date          TEXT,
  threshold_breached    INTEGER DEFAULT 0,
  adherence_gap_count   INTEGER DEFAULT 0,
  created_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
  facility_id        TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  type               TEXT,
  lat                REAL,
  lng                REAL,
  readiness_score    REAL DEFAULT 0.0,
  emergency_accepted INTEGER DEFAULT 0,
  bed_count          INTEGER DEFAULT 0,
  staff_count        INTEGER DEFAULT 0,
  created_at         TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id         TEXT PRIMARY KEY,
  facility_id       TEXT,
  name              TEXT NOT NULL,
  specialty         TEXT,
  phone             TEXT,
  status            TEXT DEFAULT 'available',
  blood_group       TEXT,
  years_experience  INTEGER,
  home_visit        INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id          TEXT PRIMARY KEY,
  doctor_id   TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  date        TEXT NOT NULL,
  slot        TEXT NOT NULL,
  status      TEXT DEFAULT 'available',
  updated_by  TEXT,
  updated_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id  TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL,
  doctor_id       TEXT,
  facility_id     TEXT,
  date            TEXT,
  time            TEXT,
  status          TEXT DEFAULT 'booked',
  change_reason   TEXT,
  rescheduled_to  TEXT,
  booked_by       TEXT,
  token_number    INTEGER,
  visit_type      TEXT DEFAULT 'new',
  mobility_needs  TEXT,
  home_visit      INTEGER DEFAULT 0,
  symptoms        TEXT,
  triage_pathway  TEXT,
  triage_risk     TEXT,
  arrived_at      TEXT,
  seen_at         TEXT,
  remarks_open    TEXT,
  remarks_close   TEXT,
  prescription    TEXT,
  follow_up       INTEGER DEFAULT 0,
  feedback_rating INTEGER,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

-- ============================================================
-- STOCK / MEDICINE AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS stock (
  id              TEXT PRIMARY KEY,
  facility_id     TEXT NOT NULL,
  medicine_name   TEXT NOT NULL,
  quantity        INTEGER DEFAULT 0,
  quantity_status TEXT DEFAULT 'available',
  last_updated    TEXT DEFAULT (datetime('now')),
  updated_by      TEXT,
  FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  scheduled_time  TEXT,
  channel         TEXT DEFAULT 'sms',
  delivery_status TEXT DEFAULT 'pending',
  retry_count     INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  referral_id   TEXT PRIMARY KEY,
  patient_id    TEXT NOT NULL,
  pathway       TEXT,
  status        TEXT DEFAULT 'created',
  from_facility TEXT,
  to_facility   TEXT,
  reason        TEXT,
  updated_at    TEXT DEFAULT (datetime('now')),
  sync_version  INTEGER DEFAULT 1,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- PRIORITY FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS priority_flags (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL,
  category        TEXT,
  reason_label    TEXT NOT NULL,
  raised_at       TEXT DEFAULT (datetime('now')),
  resolved_status INTEGER DEFAULT 0,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  entity      TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  actor       TEXT,
  reason      TEXT,
  timestamp   TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SYNC LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id              TEXT PRIMARY KEY,
  table_name      TEXT NOT NULL,
  record_id       TEXT NOT NULL,
  rejected_reason TEXT,
  timestamp       TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_asha ON patients(asha_id);
CREATE INDEX IF NOT EXISTS idx_patients_village ON patients(village);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_stock_facility ON stock(facility_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_doctor_avail ON doctor_availability(doctor_id, date);
