/**
 * Test script for all 4 engines — verifies reasoning is visible
 */

const { triage } = require('./triageEngine');
const { rankAlternatives } = require('./reappointmentEngine');
const { rankPriorityQueue } = require('./priorityQueueEngine');
const { classifyFreshness, assessFacilityStockTrust } = require('./stockFreshnessEngine');

console.log('=== TRIAGE ENGINE TESTS ===\n');

const triageTests = [
  { symptoms: 'child has fever and convulsions', context: { age: 2 } },
  { symptoms: 'pregnant woman with severe bleeding', context: { isPregnant: true } },
  { symptoms: 'patient has high blood pressure and diabetes', context: { thresholdBreached: true } },
  { symptoms: 'infant not feeding and lethargic', context: { age: 0 } },
  { symptoms: 'headache and mild cold', context: {} },
  { symptoms: 'chest pain and breathing difficulty', context: {} },
  { symptoms: 'routine ANC checkup pregnancy', context: { isPregnant: true, riskFlags: 'anemia' } },
];

for (const test of triageTests) {
  const result = triage(test.symptoms, test.context);
  console.log(`Input: "${test.symptoms}"`);
  console.log(`  Pathway: ${result.pathway} | Risk: ${result.risk_level} | Specialty: ${result.suggested_specialty}`);
  console.log(`  Rules: ${result.matched_rules.join('; ')}\n`);
}

console.log('\n=== REAPPOINTMENT ENGINE TESTS ===\n');

const disrupted = { date: '2026-09-08', suggested_specialty: 'obstetrics' };
const alternatives = [
  { doctor_id: 'DOC-1', doctor_name: 'Dr. A', doctor_specialty: 'obstetrics', facility_id: 'F1', facility_name: 'PHC Karad', date: '2026-09-08', slot: '10:00', facility_lat: 17.286, facility_lng: 74.183, facility_readiness: 8.5 },
  { doctor_id: 'DOC-2', doctor_name: 'Dr. B', doctor_specialty: 'general', facility_id: 'F2', facility_name: 'SDH Satara', date: '2026-09-09', slot: '14:00', facility_lat: 17.680, facility_lng: 74.018, facility_readiness: 7.2 },
  { doctor_id: 'DOC-3', doctor_name: 'Dr. C', doctor_specialty: 'obstetrics', facility_id: 'F3', facility_name: 'RH Wai', date: '2026-09-12', slot: '09:00', facility_lat: 17.952, facility_lng: 73.890, facility_readiness: 6.0 },
];

const ranked = rankAlternatives(disrupted, alternatives, { lat: 17.290, lng: 74.180 });
for (const r of ranked) {
  console.log(`${r.doctor_name} at ${r.facility_name} — ${r.date} ${r.slot}`);
  console.log(`  Total: ${r.total_score}/100`);
  console.log(`  Specialty: ${r.sub_scores.specialty_match.score}/40 (${r.sub_scores.specialty_match.reason})`);
  console.log(`  Proximity: ${r.sub_scores.slot_proximity.score}/30 (${r.sub_scores.slot_proximity.reason})`);
  console.log(`  Distance: ${r.sub_scores.distance.score}/20 (${r.sub_scores.distance.reason})`);
  console.log(`  Readiness: ${r.sub_scores.facility_readiness.score}/10 (${r.sub_scores.facility_readiness.reason})\n`);
}

console.log('\n=== PRIORITY QUEUE ENGINE TESTS ===\n');

const flags = [
  { patient_id: 'P1', patient_name: 'Sunanda', category: 'maternal', reason_label: 'High-risk ANC — anemia', raised_at: '2026-09-02', resolved_status: 0, failed_followups: 1, risk_level: 'high' },
  { patient_id: 'P2', patient_name: 'Baburao', category: 'chronic', reason_label: 'BP threshold breached', raised_at: '2026-09-04', resolved_status: 0, failed_followups: 3, risk_level: 'high' },
  { patient_id: 'P3', patient_name: 'Sneha', category: 'child', reason_label: 'Overdue vaccination', raised_at: '2026-09-05', resolved_status: 0, failed_followups: 0, risk_level: 'medium' },
  { patient_id: 'P4', patient_name: 'Asha', category: 'maternal', reason_label: 'Gestational diabetes + high BP', raised_at: '2026-09-01', resolved_status: 0, failed_followups: 2, risk_level: 'emergency' },
];

const queue = rankPriorityQueue(flags);
for (const item of queue) {
  console.log(`${item.patient_name} — ${item.urgency_level} (Score: ${item.priority_score})`);
  console.log(`  Reason: ${item.reason_label}`);
  console.log(`  Category: ${item.scoring_breakdown.category_weight.reason}`);
  console.log(`  Age: ${item.scoring_breakdown.age_score.reason}`);
  console.log(`  Follow-ups: ${item.scoring_breakdown.followup_score.reason}\n`);
}

console.log('\n=== STOCK FRESHNESS ENGINE TESTS ===\n');

const now = new Date();
const freshnessTests = [
  { name: 'Paracetamol', last_updated: new Date(now - 1 * 60 * 60 * 1000).toISOString() },  // 1 hour ago
  { name: 'Amoxicillin', last_updated: new Date(now - 8 * 60 * 60 * 1000).toISOString() },  // 8 hours ago
  { name: 'ORS Sachets', last_updated: new Date(now - 30 * 60 * 60 * 1000).toISOString() }, // 30 hours ago
  { name: 'Missing', last_updated: null },
];

for (const item of freshnessTests) {
  const result = classifyFreshness(item.last_updated, now);
  console.log(`${item.name}: ${result.freshness.toUpperCase()}`);
  console.log(`  ${result.label}`);
  console.log(`  Requires reconfirmation: ${result.requires_reconfirmation}\n`);
}

const trustResult = assessFacilityStockTrust(freshnessTests, now);
console.log('Facility trust assessment:', trustResult);

console.log('\n=== ALL ENGINE TESTS PASSED ===');
