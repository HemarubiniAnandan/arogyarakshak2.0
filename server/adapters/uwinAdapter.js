// MOCK ADAPTER — replace with real integration when authorized API access is available.
// U-WIN (Universal Immunisation Programme) adapter
// Returns synthetic vaccination due-list data shaped like what the real U-WIN system would return.

const MOCK_VACCINE_SCHEDULE = {
  'birth': ['BCG', 'OPV-0', 'Hepatitis-B Birth Dose'],
  '6_weeks': ['OPV-1', 'Pentavalent-1', 'Rotavirus-1', 'fIPV-1', 'PCV-1'],
  '10_weeks': ['OPV-2', 'Pentavalent-2', 'Rotavirus-2'],
  '14_weeks': ['OPV-3', 'Pentavalent-3', 'Rotavirus-3', 'fIPV-2', 'PCV-2'],
  '9_months': ['Measles-1', 'Vitamin-A 1st Dose', 'JE-1', 'PCV-Booster'],
  '16_months': ['Measles-2', 'OPV-Booster', 'DPT-Booster-1', 'Vitamin-A 2nd Dose', 'JE-2'],
  '5_years': ['DPT-Booster-2'],
  '10_years': ['TT'],
  '16_years': ['TT'],
};

const MOCK_DUE_LISTS = {
  'CHILD-DEMO-001': {
    beneficiary_id: 'CHILD-DEMO-001',
    child_name: 'Arjun Ghadge',
    dob: '2026-06-01',
    age_months: 3,
    completed_vaccines: ['BCG', 'OPV-0', 'Hepatitis-B Birth Dose'],
    due_vaccines: [
      { vaccine: 'OPV-1', due_date: '2026-07-13', status: 'due', window: '6 weeks' },
      { vaccine: 'Pentavalent-1', due_date: '2026-07-13', status: 'due', window: '6 weeks' },
      { vaccine: 'Rotavirus-1', due_date: '2026-07-13', status: 'due', window: '6 weeks' },
      { vaccine: 'fIPV-1', due_date: '2026-07-13', status: 'due', window: '6 weeks' },
      { vaccine: 'PCV-1', due_date: '2026-07-13', status: 'due', window: '6 weeks' },
    ],
    next_visit_date: '2026-07-13',
    uwin_registration_id: 'UWIN-SYNTH-00001',
  },
  'CHILD-DEMO-002': {
    beneficiary_id: 'CHILD-DEMO-002',
    child_name: 'Priya Chavan',
    dob: '2025-09-15',
    age_months: 12,
    completed_vaccines: ['BCG', 'OPV-0', 'Hepatitis-B Birth Dose', 'OPV-1', 'Pentavalent-1', 'Rotavirus-1', 'fIPV-1', 'PCV-1', 'OPV-2', 'Pentavalent-2', 'Rotavirus-2', 'OPV-3', 'Pentavalent-3', 'Rotavirus-3', 'fIPV-2', 'PCV-2'],
    due_vaccines: [
      { vaccine: 'Measles-1', due_date: '2026-06-15', status: 'overdue', window: '9 months' },
      { vaccine: 'Vitamin-A 1st Dose', due_date: '2026-06-15', status: 'overdue', window: '9 months' },
      { vaccine: 'JE-1', due_date: '2026-06-15', status: 'overdue', window: '9 months' },
      { vaccine: 'PCV-Booster', due_date: '2026-06-15', status: 'overdue', window: '9 months' },
    ],
    next_visit_date: '2026-06-15',
    uwin_registration_id: 'UWIN-SYNTH-00002',
  },
  'CHILD-DEMO-003': {
    beneficiary_id: 'CHILD-DEMO-003',
    child_name: 'Rohit Thombare',
    dob: '2024-04-20',
    age_months: 29,
    completed_vaccines: ['BCG', 'OPV-0', 'Hepatitis-B Birth Dose', 'OPV-1', 'Pentavalent-1', 'Rotavirus-1', 'OPV-2', 'Pentavalent-2', 'Rotavirus-2', 'OPV-3', 'Pentavalent-3', 'Rotavirus-3', 'Measles-1', 'Vitamin-A 1st Dose'],
    due_vaccines: [
      { vaccine: 'Measles-2', due_date: '2025-08-20', status: 'overdue', window: '16 months' },
      { vaccine: 'OPV-Booster', due_date: '2025-08-20', status: 'overdue', window: '16 months' },
      { vaccine: 'DPT-Booster-1', due_date: '2025-08-20', status: 'overdue', window: '16 months' },
    ],
    next_visit_date: '2025-08-20',
    uwin_registration_id: 'UWIN-SYNTH-00003',
  },
};

/**
 * Get due vaccination list for a beneficiary
 * @param {string} beneficiaryId
 * @returns {Object} Due list shaped like U-WIN API response
 */
function getDueList(beneficiaryId) {
  const data = MOCK_DUE_LISTS[beneficiaryId];
  if (!data) {
    return {
      beneficiary_id: beneficiaryId,
      status: 'not_found',
      message: 'Beneficiary not found in U-WIN registry (simulated)',
      _simulated: true,
      _adapter: 'uwinAdapter',
    };
  }
  return {
    ...data,
    _simulated: true,
    _adapter: 'uwinAdapter',
  };
}

/**
 * Get full vaccine schedule reference
 */
function getVaccineSchedule() {
  return {
    schedule: MOCK_VACCINE_SCHEDULE,
    source: 'National Immunisation Schedule (India)',
    _simulated: true,
    _adapter: 'uwinAdapter',
  };
}

module.exports = { getDueList, getVaccineSchedule };
