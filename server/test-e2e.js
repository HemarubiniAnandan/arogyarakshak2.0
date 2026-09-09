const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'aarogya.db');
const db = new Database(dbPath);

console.log('===================================================');
console.log(' AarogyaRakshak 2.0 E2E Automated Verification Test');
console.log('===================================================');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  try {
    // Test 1: Tables check
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    assert(tables.length >= 15, `Database has ${tables.length} tables (>= 15 required).`);

    // Test 2: Seed counts
    const patientCount = db.prepare('SELECT COUNT(*) as c FROM patients').get().c;
    const doctorCount = db.prepare('SELECT COUNT(*) as c FROM doctors').get().c;
    const facilityCount = db.prepare('SELECT COUNT(*) as c FROM facilities').get().c;
    assert(patientCount >= 15, `Found ${patientCount} seeded patients.`);
    assert(doctorCount >= 5, `Found ${doctorCount} seeded doctors.`);
    assert(facilityCount >= 3, `Found ${facilityCount} seeded facilities.`);

    // Test 3: Triage Engine
    const { triage } = require('./engines/triageEngine');
    const triageRes = triage('High fever and severe breathlessness during pregnancy', { age: 26 });
    assert(triageRes.pathway === 'maternal' && triageRes.risk_level === 'emergency', 'Triage correctly routed maternal emergency.');

    // Test 4: Priority Queue Engine
    const { rankPriorityQueue } = require('./engines/priorityQueueEngine');
    const flags = db.prepare('SELECT pf.*, p.name as patient_name FROM priority_flags pf JOIN patients p ON pf.patient_id = p.patient_id').all();
    const rankedFlags = rankPriorityQueue(flags);
    assert(rankedFlags.length > 0 && rankedFlags[0].score >= rankedFlags[rankedFlags.length - 1].score, 'Priority queue correctly ranked by risk score.');

    // Test 5: Stock Freshness Engine
    const { classifyBatch } = require('./engines/stockFreshnessEngine');
    const stockItems = db.prepare('SELECT * FROM stock').all();
    const classifiedStock = classifyBatch(stockItems);
    assert(classifiedStock.every(s => ['fresh', 'aging', 'stale'].includes(s.freshness)), 'Stock items correctly classified for freshness.');

    // Test 6: Reappointment Engine
    const { rankAlternatives } = require('./engines/reappointmentEngine');
    const avail = db.prepare('SELECT da.*, d.name as doctor_name, f.facility_id, f.lat as facility_lat, f.lng as facility_lng, f.readiness_score as facility_readiness FROM doctor_availability da JOIN doctors d ON da.doctor_id = d.doctor_id JOIN facilities f ON d.facility_id = f.facility_id').all();
    const altRes = rankAlternatives({ date: '2026-09-07', suggested_specialty: 'Obstetrics' }, avail, { lat: 17.28, lng: 74.18 });
    assert(altRes.length > 0 && altRes[0].final_score > 0, 'Reappointment engine ranked slots transparently.');

    // Test 7: Mock Adapters
    const uwin = require('./adapters/uwinAdapter');
    const eaushadhi = require('./adapters/eAushadhiAdapter');
    const esanjeevani = require('./adapters/esanjeevaniAdapter');
    const abdm = require('./adapters/abdmAdapter');

    assert(uwin.getVaccineSchedule().schedule !== undefined, 'U-WIN adapter returned vaccine schedule.');
    assert(eaushadhi.searchMedicine('Paracetamol').query === 'Paracetamol', 'e-Aushadhi adapter searched medicine stock.');
    assert(esanjeevani.getTeleSlots().length > 0, 'eSanjeevani adapter returned teleconsultation slots.');
    assert(abdm.getFhirHealthRecord('PATIENT-DEMO-001').resourceType === 'Bundle', 'ABDM adapter returned FHIR Bundle.');

    // Test 8: Notifications Simulated Service
    const notifications = require('./routes/notifications')(db);
    const smsRes = await notifications.sendSMS('+919876500040', 'Test SMS');
    assert(smsRes.success, 'Notification service sendSMS executed cleanly.');

    console.log('===================================================');
    console.log(` E2E Verification Results: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('===================================================');
  } catch (err) {
    console.error('Fatal E2E test error:', err);
  }
}

runTests();
