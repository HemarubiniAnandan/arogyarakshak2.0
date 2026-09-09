// MOCK ADAPTER — replace with real integration when authorized API access is available.
// e-Aushadhi (Drug Distribution Management System) adapter
// Returns synthetic medicine stock/supply data shaped like what the real e-Aushadhi system would return.

const MOCK_STOCK_DATA = {
  'FAC-DEMO-001': {
    facility_id: 'FAC-DEMO-001',
    facility_name: 'Primary Health Centre, Karad',
    last_sync: '2026-09-06T10:30:00Z',
    medicines: [
      { drug_code: 'EA-001', name: 'Paracetamol 500mg', category: 'Analgesic', batch: 'BAT-2026-A1', expiry: '2027-06-30', available_qty: 500, unit: 'tablets', min_stock: 100 },
      { drug_code: 'EA-002', name: 'Amoxicillin 250mg', category: 'Antibiotic', batch: 'BAT-2026-B2', expiry: '2027-03-15', available_qty: 200, unit: 'capsules', min_stock: 50 },
      { drug_code: 'EA-003', name: 'Iron Folic Acid', category: 'Supplement', batch: 'BAT-2026-C1', expiry: '2027-12-31', available_qty: 1000, unit: 'tablets', min_stock: 200 },
      { drug_code: 'EA-004', name: 'ORS Sachets', category: 'Rehydration', batch: 'BAT-2026-D1', expiry: '2027-09-30', available_qty: 300, unit: 'sachets', min_stock: 50 },
      { drug_code: 'EA-005', name: 'Metformin 500mg', category: 'Anti-diabetic', batch: 'BAT-2026-E1', expiry: '2027-08-15', available_qty: 150, unit: 'tablets', min_stock: 30 },
    ],
  },
  'FAC-DEMO-002': {
    facility_id: 'FAC-DEMO-002',
    facility_name: 'Sub-District Hospital, Satara',
    last_sync: '2026-09-06T09:15:00Z',
    medicines: [
      { drug_code: 'EA-001', name: 'Paracetamol 500mg', category: 'Analgesic', batch: 'BAT-2026-F1', expiry: '2027-04-30', available_qty: 800, unit: 'tablets', min_stock: 200 },
      { drug_code: 'EA-006', name: 'Amlodipine 5mg', category: 'Anti-hypertensive', batch: 'BAT-2026-G1', expiry: '2027-07-31', available_qty: 300, unit: 'tablets', min_stock: 50 },
      { drug_code: 'EA-007', name: 'Insulin (Regular)', category: 'Anti-diabetic', batch: 'BAT-2026-H1', expiry: '2026-12-31', available_qty: 25, unit: 'vials', min_stock: 10 },
    ],
  },
  'FAC-DEMO-003': {
    facility_id: 'FAC-DEMO-003',
    facility_name: 'Rural Hospital, Wai',
    last_sync: '2026-09-05T14:00:00Z',
    medicines: [
      { drug_code: 'EA-001', name: 'Paracetamol 500mg', category: 'Analgesic', batch: 'BAT-2026-I1', expiry: '2027-02-28', available_qty: 100, unit: 'tablets', min_stock: 100 },
      { drug_code: 'EA-008', name: 'Salbutamol Inhaler', category: 'Bronchodilator', batch: 'BAT-2026-J1', expiry: '2027-05-31', available_qty: 10, unit: 'inhalers', min_stock: 5 },
    ],
  },
};

/**
 * Get stock/supply info for a facility
 */
function getStockInfo(facilityId) {
  const data = MOCK_STOCK_DATA[facilityId];
  if (!data) {
    return { facility_id: facilityId, status: 'not_found', message: 'Facility not found in e-Aushadhi registry (simulated)', _simulated: true, _adapter: 'eAushadhiAdapter' };
  }
  return { ...data, _simulated: true, _adapter: 'eAushadhiAdapter' };
}

/**
 * Search medicine across all facilities
 */
function searchMedicine(medicineName) {
  const results = [];
  const search = medicineName.toLowerCase();
  for (const [facId, facData] of Object.entries(MOCK_STOCK_DATA)) {
    for (const med of facData.medicines) {
      if (med.name.toLowerCase().includes(search)) {
        results.push({
          facility_id: facId,
          facility_name: facData.facility_name,
          medicine: med,
          last_sync: facData.last_sync,
        });
      }
    }
  }
  return { query: medicineName, results, count: results.length, _simulated: true, _adapter: 'eAushadhiAdapter' };
}

module.exports = { getStockInfo, searchMedicine };
