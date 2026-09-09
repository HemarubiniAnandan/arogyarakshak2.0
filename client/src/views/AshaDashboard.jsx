import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentTrackerStepper from '../components/AppointmentTrackerStepper';
import PrescriptionPdfModal from '../components/PrescriptionPdfModal';

export default function AshaDashboard({ user }) {
  const [patients, setPatients] = useState([]);
  const [priorityFlags, setPriorityFlags] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(true);

  // Dynamic filter state from stat cards
  const [statFilter, setStatFilter] = useState('all');

  // Search Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-Suggest Booking state for ASHA
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bookingSymptoms, setBookingSymptoms] = useState('');
  const [homeVisitRequested, setHomeVisitRequested] = useState(false);

  // Dynamic Patient History View Modal State
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);
  const [patientHistoryDetail, setPatientHistoryDetail] = useState(null);

  // Prescription Modal State
  const [selectedPrescriptionApt, setSelectedPrescriptionApt] = useState(null);

  // Call Patient 2-Step Modal State
  const [callModalApt, setCallModalApt] = useState(null);
  const [callAttended, setCallAttended] = useState(null);
  const [patientFeedback, setPatientFeedback] = useState('');
  const [rating, setRating] = useState('5');
  const [completedFollowUps, setCompletedFollowUps] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch('http://localhost:3001/api/patients', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const pData = await pRes.json();
      setPatients(pData);

      const pfRes = await fetch('http://localhost:3001/api/priority-flags', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const pfData = await pfRes.json();
      setPriorityFlags(pfData);

      const aptRes = await fetch('http://localhost:3001/api/appointments', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const aptData = await aptRes.json();
      setAppointments(aptData);
    } catch (err) {
      console.error('ASHA dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPatientHistory = async (patient) => {
    setViewHistoryPatient(patient);
    try {
      const res = await fetch(`http://localhost:3001/api/patients/${patient.patient_id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const detail = await res.json();
      setPatientHistoryDetail(detail);
    } catch (err) {
      console.error('Failed to fetch patient history:', err);
      setPatientHistoryDetail(patient);
    }
  };

  const handleResolveFlag = async (flagId) => {
    try {
      await fetch(`http://localhost:3001/api/priority-flags/${flagId}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to resolve flag');
    }
  };

  const filteredPatients = patients.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.village && p.village.toLowerCase().includes(query)) ||
      (p.phone && p.phone.includes(query))
    );
  });

  const autoSuggestedPatients = patientSearchInput.trim() ? patients.filter(p => {
    const q = patientSearchInput.trim().toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }) : [];

  const handleCallSubmit = (e) => {
    e.preventDefault();
    if (!callModalApt) return;

    if (callAttended === false) {
      alert(`Recorded: Call to ${callModalApt.patient_name || 'Patient'} was not attended. Task remains pending for retry.`);
      setCallModalApt(null);
      setCallAttended(null);
      return;
    }

    setCompletedFollowUps(prev => ({ ...prev, [callModalApt.appointment_id]: { feedback: patientFeedback, rating } }));
    alert(`Feedback logged! Follow-up marked completed for token #${callModalApt.token_number}.`);
    setCallModalApt(null);
    setCallAttended(null);
    setPatientFeedback('');
  };

  return (
    <div className="gov-container">
      {/* Header Stat Box */}
      <div className="gov-card" style={{ borderLeft: '6px solid var(--uwin-teal)', backgroundColor: 'var(--uwin-teal-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: 'var(--uwin-navy)' }}>ASHA Worker Operations &amp; Rural Health Desk</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--uwin-text-muted)', marginTop: '4px' }}>
              Logged as: <strong>{user.name}</strong> | Catchment Area: <strong>Umbraj &amp; Masur Villages</strong> | Facility: <strong>PHC Karad</strong>
            </p>
          </div>
          <button onClick={() => navigate('/register')} className="gov-btn gov-btn-teal">
            + Register New Rural Patient
          </button>
        </div>
      </div>

      {/* Priority Stat Counters */}
      <div className="gov-grid" style={{ marginBottom: '22px' }}>
        <div
          className="gov-stat-box"
          style={{ borderLeftColor: 'var(--uwin-danger)', cursor: 'pointer', backgroundColor: statFilter === 'priority' ? '#FEF2F2' : '#FFFFFF' }}
          onClick={() => { setStatFilter('priority'); setActiveTab('queue'); }}
        >
          <div className="gov-stat-number" style={{ color: 'var(--uwin-danger)' }}>{priorityFlags.length}</div>
          <div className="gov-stat-label">Priority Escalations Due</div>
        </div>

        <div
          className="gov-stat-box"
          style={{ borderLeftColor: 'var(--uwin-navy)', cursor: 'pointer', backgroundColor: statFilter === 'patients' ? '#F1F5F9' : '#FFFFFF' }}
          onClick={() => { setStatFilter('patients'); setActiveTab('patients'); }}
        >
          <div className="gov-stat-number" style={{ color: 'var(--uwin-navy)' }}>{patients.length}</div>
          <div className="gov-stat-label">Assigned Rural Patients</div>
        </div>

        <div
          className="gov-stat-box"
          style={{ borderLeftColor: 'var(--uwin-emerald)', cursor: 'pointer', backgroundColor: statFilter === 'appointments' ? 'var(--uwin-emerald-bg)' : '#FFFFFF' }}
          onClick={() => { setStatFilter('appointments'); setActiveTab('shipment'); }}
        >
          <div className="gov-stat-number" style={{ color: 'var(--uwin-emerald)' }}>{appointments.length}</div>
          <div className="gov-stat-label">Appointments Tracked</div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="gov-card">
        <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid var(--uwin-border)', marginBottom: '22px', overflowX: 'auto' }}>
          {[
            { id: 'queue', label: 'Priority Escalation Queue' },
            { id: 'patients', label: 'Patient Roster & Care Passport' },
            { id: 'assisted_booking', label: 'Assisted Appointment Booking' },
            { id: 'shipment', label: 'Appointment Stepper & Call Log' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setStatFilter('all'); }}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === t.id ? '3px solid var(--uwin-navy)' : '3px solid transparent',
                backgroundColor: activeTab === t.id ? '#F1F5F9' : 'transparent',
                color: activeTab === t.id ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
                fontWeight: activeTab === t.id ? '800' : '600',
                cursor: 'pointer',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Priority Queue */}
        {activeTab === 'queue' && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '10px' }}>
              Priority Queue (Ranked by Risk Category, Aging &amp; Outreach History)
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginBottom: '15px' }}>
              High-risk cases requiring immediate home visits or follow-up calls from ASHA worker.
            </p>

            {priorityFlags.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)' }}>All priority cases resolved.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Patient Name</th>
                    <th>Village</th>
                    <th>Category</th>
                    <th>Reason &amp; Clinical Label</th>
                    <th>Urgency Level</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityFlags.map((flag, idx) => {
                    const score = flag.priority_score || flag.score || 120;
                    let urgencyBadge = 'gov-badge-aging';
                    if (score >= 180) urgencyBadge = 'gov-badge-stale';

                    return (
                      <tr key={flag.id}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td><strong>{flag.patient_name}</strong> ({flag.patient_phone})</td>
                        <td>{flag.village}</td>
                        <td>
                          <span className={`gov-badge ${flag.category === 'maternal' ? 'gov-badge-stale' : 'gov-badge-aging'}`}>
                            {flag.category?.toUpperCase() || 'GENERAL'}
                          </span>
                        </td>
                        <td>{flag.reason_label}</td>
                        <td>
                          <span className={`gov-badge ${urgencyBadge}`}>
                            {flag.urgency_level || (score >= 180 ? 'CRITICAL' : score >= 130 ? 'URGENT' : 'HIGH')}
                          </span>
                        </td>
                        <td><strong>{score} pts</strong></td>
                        <td>
                          <button
                            onClick={() => handleResolveFlag(flag.id)}
                            className="gov-btn gov-btn-success"
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          >
                            Mark Resolved
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Patient Roster & Dynamic Medical History Passport */}
        {activeTab === 'patients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ color: 'var(--uwin-navy)' }}>Assigned Catchment Patient Roster</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '2px' }}>
                  Click any patient to view their dynamic medical history, appointment progress steppers, and e-prescriptions.
                </p>
              </div>
              <div style={{ width: '320px' }}>
                <input
                  type="text"
                  className="gov-input"
                  placeholder="Search patient by name, village, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List View of Patient Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredPatients.length === 0 ? (
                <p style={{ color: 'var(--uwin-text-muted)' }}>No matching patient records found.</p>
              ) : (
                filteredPatients.map(p => (
                  <div
                    key={p.patient_id}
                    style={{
                      border: '1px solid var(--uwin-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: 'var(--uwin-shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ color: 'var(--uwin-navy)', margin: 0 }}>{p.name}</h4>
                        <span className="gov-badge gov-badge-aging">ABHA: {p.abha_id || 'ABHA-SYNTH-001'}</span>
                        <span className="gov-badge gov-badge-fresh">Blood: {p.blood_group || 'B+'}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginTop: '6px', margin: 0 }}>
                        ID: <strong>{p.patient_id}</strong> | Village: <strong>{p.village || 'Umbraj'}</strong> | Phone: <strong>{p.phone || '+919876500101'}</strong> | Age: <strong>{p.age || 24}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenPatientHistory(p)}
                        className="gov-btn gov-btn-teal"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        View Dynamic Care Passport
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          setActiveTab('assisted_booking');
                        }}
                        className="gov-btn gov-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Assisted Booking */}
        {activeTab === 'assisted_booking' && (
          <div style={{ maxWidth: '700px' }}>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>
              Assisted Appointment Booking on Behalf of Citizen
            </h4>

            <div className="gov-form-group" style={{ position: 'relative' }}>
              <label className="gov-label">Search Patient Name or Phone (Auto-Suggest)</label>
              <input
                type="text"
                className="gov-input"
                placeholder="Type patient name (e.g. Sunanda, Lata)..."
                value={selectedPatient ? selectedPatient.name : patientSearchInput}
                onChange={(e) => {
                  setPatientSearchInput(e.target.value);
                  setSelectedPatient(null);
                }}
              />

              {autoSuggestedPatients.length > 0 && !selectedPatient && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--uwin-navy)',
                  borderRadius: '6px',
                  boxShadow: 'var(--uwin-shadow-md)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {autoSuggestedPatients.map(p => (
                    <div
                      key={p.patient_id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearchInput(p.name);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--uwin-border)',
                        fontSize: '0.88rem',
                      }}
                    >
                      <strong>{p.name}</strong> ({p.village}) — Phone: {p.phone || 'N/A'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div style={{ backgroundColor: 'var(--uwin-teal-light)', border: '1px solid var(--uwin-teal)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.88rem' }}>
                Selected Patient: <strong>{selectedPatient.name}</strong> | ID: <strong>{selectedPatient.patient_id}</strong> | Village: <strong>{selectedPatient.village}</strong>
              </div>
            )}

            <div className="gov-form-group">
              <label className="gov-label">Symptoms / Health Reason</label>
              <textarea
                className="gov-textarea"
                rows="3"
                placeholder="Describe symptoms observed by ASHA worker..."
                value={bookingSymptoms}
                onChange={(e) => setBookingSymptoms(e.target.value)}
              ></textarea>
            </div>

            <button
              onClick={() => {
                if (!selectedPatient) {
                  alert('Please search and select a patient first.');
                  return;
                }
                navigate(`/patient/book?patient_id=${selectedPatient.patient_id}&home_visit=${homeVisitRequested ? '1' : '0'}`);
              }}
              className="gov-btn gov-btn-teal"
            >
              Proceed to Slot Selection &amp; Doctor Match &rarr;
            </button>
          </div>
        )}

        {/* Tab 4: Appointment Stepper Tracker */}
        {activeTab === 'shipment' && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>
              Appointment Progress &amp; Follow-up Call Tracker
            </h4>

            {appointments.map(apt => (
              <div key={apt.appointment_id} style={{ border: '1px solid var(--uwin-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Token #{apt.token_number || 1}</strong> — Patient: <strong>{apt.patient_name || 'Sunanda Kamble'}</strong> ({apt.patient_phone})<br/>
                    <span style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)' }}>Facility: {apt.facility_name || 'PHC Karad'} | Scheduled: {apt.date} {apt.time}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCallModalApt(apt);
                      setCallAttended(null);
                    }}
                    className="gov-btn gov-btn-teal"
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    Call Patient
                  </button>
                </div>
                <AppointmentTrackerStepper appointment={apt} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Patient Passport & Medical History Modal */}
      {viewHistoryPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 46, 90, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="gov-card" style={{ width: '90%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', margin: 0, borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--uwin-border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--uwin-navy)', margin: 0 }}>
                Patient Care Passport &amp; Medical History (Live DB)
              </h3>
              <button onClick={() => setViewHistoryPatient(null)} className="gov-btn gov-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                ✕ Close
              </button>
            </div>

            {/* Patient Header Block */}
            <div style={{ backgroundColor: 'var(--uwin-teal-light)', border: '1px solid var(--uwin-teal)', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
              <strong>Patient Name:</strong> {viewHistoryPatient.name} | <strong>ABHA ID:</strong> {viewHistoryPatient.abha_id || 'ABHA-SYNTH-001'}<br />
              <strong>Phone:</strong> {viewHistoryPatient.phone || '+919876500101'} | <strong>Village:</strong> {viewHistoryPatient.village || 'Umbraj'}<br />
              <strong>Blood Group:</strong> <span className="gov-badge gov-badge-aging">{viewHistoryPatient.blood_group || 'B+'}</span> | <strong>Age:</strong> {viewHistoryPatient.age || 24}
            </div>

            {/* Pre-existing Profile */}
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '8px' }}>Pre-existing Chronic Profile &amp; Allergies</h4>
            <div className="gov-grid-2" style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid var(--uwin-border)', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <p><strong>Chronic Conditions:</strong> {viewHistoryPatient.chronic_conditions || 'None reported'}</p>
                <p><strong>Known Allergies:</strong> <span style={{ color: viewHistoryPatient.allergies ? 'var(--uwin-danger)' : 'inherit', fontWeight: 'bold' }}>{viewHistoryPatient.allergies || 'Penicillin'}</span></p>
              </div>
              <div>
                <p><strong>Past Medications:</strong> {viewHistoryPatient.past_medications || 'Tab Paracetamol 500mg'}</p>
                <p><strong>Disability Notes:</strong> {viewHistoryPatient.disability || 'None'}</p>
              </div>
            </div>

            {/* Consultation History with Steppers */}
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '10px' }}>
              Recent Consultations &amp; Progress Steppers
            </h4>

            {(!patientHistoryDetail?.appointments || patientHistoryDetail.appointments.length === 0) ? (
              <p style={{ color: 'var(--uwin-text-muted)', fontSize: '0.88rem' }}>No past consultations recorded for this patient.</p>
            ) : (
              patientHistoryDetail.appointments.map(apt => (
                <div key={apt.appointment_id} style={{ border: '1px solid var(--uwin-border)', borderRadius: '8px', padding: '14px', marginBottom: '14px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Date:</strong> {apt.date} at {apt.time} | <strong>Doctor:</strong> {apt.doctor_name || 'Medical Officer'}
                    </div>
                    {apt.prescription && (
                      <button
                        onClick={() => setSelectedPrescriptionApt(apt)}
                        className="gov-btn gov-btn-teal"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        View PDF Prescription
                      </button>
                    )}
                  </div>

                  <AppointmentTrackerStepper appointment={apt} />
                </div>
              ))
            )}

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => setViewHistoryPatient(null)} className="gov-btn gov-btn-teal">
                Close Care Passport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Government Prescription PDF Modal */}
      {selectedPrescriptionApt && (
        <PrescriptionPdfModal
          appointment={selectedPrescriptionApt}
          onClose={() => setSelectedPrescriptionApt(null)}
        />
      )}

      {/* 2-Step Follow-Up Call Modal */}
      {callModalApt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,46,90,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="gov-card" style={{ width: '90%', maxWidth: '550px', margin: 0, borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--uwin-navy)', marginBottom: '12px' }}>
              Follow-Up Call Log: {callModalApt.patient_name || 'Patient'}
            </h3>

            <form onSubmit={handleCallSubmit}>
              <div className="gov-form-group">
                <label className="gov-label">Did the patient attend / answer the call? *</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input
                      type="radio"
                      name="callAttended"
                      required
                      onChange={() => setCallAttended(true)}
                    />
                    Yes, Call Connected
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--uwin-danger)' }}>
                    <input
                      type="radio"
                      name="callAttended"
                      onChange={() => setCallAttended(false)}
                    />
                    No, Unreachable / Busy
                  </label>
                </div>
              </div>

              {callAttended === true && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--uwin-border)' }}>
                  <div className="gov-form-group">
                    <label className="gov-label">Patient Feedback &amp; Review Remarks *</label>
                    <textarea
                      className="gov-textarea"
                      rows="3"
                      required
                      placeholder="Enter patient feedback or satisfaction remarks..."
                      value={patientFeedback}
                      onChange={(e) => setPatientFeedback(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setCallModalApt(null)} className="gov-btn gov-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-teal">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
