// MOCK ADAPTER — replace with real integration when authorized API access is available.
// eSanjeevani (Teleconsultation) adapter
// Returns synthetic teleconsultation slot and session data.

const MOCK_TELECONSULT_DATA = {
  'DOC-DEMO-001': {
    doctor_id: 'DOC-DEMO-001',
    doctor_name: 'Dr. Meera Joshi',
    teleconsult_enabled: true,
    platform: 'eSanjeevani',
    available_slots: [
      { date: '2026-09-08', time: '11:00', duration_min: 15, status: 'available' },
      { date: '2026-09-08', time: '11:30', duration_min: 15, status: 'available' },
      { date: '2026-09-09', time: '10:00', duration_min: 15, status: 'available' },
    ],
  },
  'DOC-DEMO-003': {
    doctor_id: 'DOC-DEMO-003',
    doctor_name: 'Dr. Priya Kulkarni',
    teleconsult_enabled: true,
    platform: 'eSanjeevani',
    available_slots: [
      { date: '2026-09-09', time: '15:00', duration_min: 15, status: 'available' },
      { date: '2026-09-10', time: '09:00', duration_min: 15, status: 'available' },
    ],
  },
};

function getConsultationSlots(doctorId) {
  const data = MOCK_TELECONSULT_DATA[doctorId];
  if (!data) {
    return { doctor_id: doctorId, teleconsult_enabled: false, message: 'Doctor not registered on eSanjeevani (simulated)', _simulated: true, _adapter: 'esanjeevaniAdapter' };
  }
  return { ...data, _simulated: true, _adapter: 'esanjeevaniAdapter' };
}

function getSessionHistory(patientId) {
  return {
    patient_id: patientId,
    sessions: [
      { session_id: 'ESANJ-SYNTH-001', date: '2026-08-20', doctor: 'Dr. Meera Joshi', summary: 'General checkup — advised blood tests', status: 'completed' },
    ],
    _simulated: true,
    _adapter: 'esanjeevaniAdapter',
  };
}

module.exports = { getConsultationSlots, getSessionHistory };
