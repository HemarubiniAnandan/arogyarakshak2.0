// MOCK ADAPTER — replace with real integration when authorized API access is available.
// ABDM (Ayushman Bharat Digital Mission) adapter
// Returns FHIR-shaped synthetic health records for future interoperability.

function getHealthRecords(abhaId) {
  if (!abhaId || !abhaId.startsWith('ABHA-SYNTH')) {
    return { abha_id: abhaId, status: 'not_found', message: 'ABHA ID not found in ABDM registry (simulated)', _simulated: true, _adapter: 'abdmAdapter' };
  }

  return {
    abha_id: abhaId,
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          identifier: [{ system: 'https://healthid.abdm.gov.in', value: abhaId }],
          name: [{ use: 'official', text: 'Synthetic Patient' }],
        },
      },
      {
        resource: {
          resourceType: 'Condition',
          code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }] },
          clinicalStatus: { coding: [{ code: 'active' }] },
          onsetDateTime: '2024-01-15',
        },
      },
      {
        resource: {
          resourceType: 'MedicationStatement',
          medicationCodeableConcept: { text: 'Amlodipine 5mg' },
          dosage: [{ text: 'Once daily' }],
          status: 'active',
        },
      },
      {
        resource: {
          resourceType: 'DiagnosticReport',
          code: { text: 'Complete Blood Count' },
          effectiveDateTime: '2026-08-15',
          conclusion: 'Within normal limits',
        },
      },
    ],
    _simulated: true,
    _adapter: 'abdmAdapter',
  };
}

function verifyAbhaId(abhaId) {
  return {
    abha_id: abhaId,
    verified: abhaId && abhaId.startsWith('ABHA-SYNTH'),
    name: 'Synthetic Patient',
    _simulated: true,
    _adapter: 'abdmAdapter',
  };
}

module.exports = { getHealthRecords, verifyAbhaId };
