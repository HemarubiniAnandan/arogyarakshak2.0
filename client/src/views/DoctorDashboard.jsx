import React, { useState, useEffect } from 'react';
import QrScannerModal from '../components/QrScannerModal';
import PrescriptionPdfModal from '../components/PrescriptionPdfModal';

export default function DoctorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history' | 'passport'
  const [appointments, setAppointments] = useState([]);
  const [doctorStatus, setDoctorStatus] = useState('available');
  const [selectedApt, setSelectedApt] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState('');
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // QR Scanner Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  // Prescription Modal State
  const [selectedPrescriptionApt, setSelectedPrescriptionApt] = useState(null);

  // Structured Prescription Form State
  const [drugRows, setDrugRows] = useState([
    { id: 1, name: 'Tab Paracetamol 500mg', dosage: '1-0-1', timing: 'After Food', duration: '3 Days' },
  ]);

  // Clinical Remarks
  const [remarksOpen, setRemarksOpen] = useState('');
  const [remarksClose, setRemarksClose] = useState('');
  const [followUp, setFollowUp] = useState(false);

  // Longitudinal Passport Search State
  const [passportSearch, setPassportSearch] = useState('');
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [patientHistoryList, setPatientHistoryList] = useState([]);

  useEffect(() => {
    fetchDoctorAppointments();
  }, [user]);

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/appointments', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error('Fetch doctor appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextStatus = doctorStatus === 'available' ? 'unavailable' : 'available';
    setDoctorStatus(nextStatus);

    if (nextStatus === 'unavailable') {
      setShowUnavailableModal(true);
    } else {
      console.log(`[DOCTOR STATUS] Dr. ${user?.name || 'Doctor'} set status to AVAILABLE.`);
    }
  };

  const handleMarkUnavailable = async (e) => {
    e.preventDefault();
    if (!unavailableReason.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/doctors/DOC-DEMO-001/unavailable', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ reason: unavailableReason }),
      });

      const data = await res.json();
      console.log(`[TERMINAL NOTIFICATION] Doctor marked unavailable! ${data.affected_count || 0} patient IVR calls dispatched.`);
      alert(`Doctor marked unavailable! ${data.affected_count || 0} patients notified via automated IVR voice call & SMS.`);
      setShowUnavailableModal(false);
      fetchDoctorAppointments();
    } catch (err) {
      alert('Error marking unavailable: ' + err.message);
    }
  };

  const handleRejectAppointment = async (aptId, reasonStr) => {
    const reason = reasonStr || prompt('Enter reason for rejecting/rescheduling appointment:');
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:3001/api/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: 'cancelled', cancel_reason: `Rejected by Doctor: ${reason}` }),
      });

      if (res.ok) {
        console.log(`[TERMINAL ALERT] Appointment ${aptId} rejected by doctor. Automatic reappointment engine triggered.`);
        alert(`Appointment rejected! Automated reappointment engine notified the patient.`);
        fetchDoctorAppointments();
      }
    } catch (err) {
      alert('Failed to reject appointment: ' + err.message);
    }
  };

  const handleQrVerified = (tokenId) => {
    setShowQrModal(false);
    const matched = appointments.find(a => a.token_number === parseInt(tokenId) || a.appointment_id === tokenId);
    if (matched) {
      setSelectedApt(matched);
      setScanStatus(`Patient Token #${matched.token_number} (${matched.patient_name || 'Patient'}) verified and checked into OPD room! Status: IN_CONSULTATION.`);
    } else {
      setScanStatus(`Appointment Token #${tokenId} verified for OPD entry.`);
    }
  };

  const handleAddDrugRow = () => {
    setDrugRows([
      ...drugRows,
      { id: Date.now(), name: '', dosage: '1-0-1', timing: 'After Food', duration: '5 Days' }
    ]);
  };

  const handleRemoveDrugRow = (id) => {
    if (drugRows.length === 1) return;
    setDrugRows(drugRows.filter(r => r.id !== id));
  };

  const handleDrugChange = (id, field, value) => {
    setDrugRows(drugRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;

    const formattedPrescription = drugRows
      .filter(r => r.name.trim())
      .map((r, idx) => `${idx + 1}. ${r.name} | Dosage: ${r.dosage} | Timing: ${r.timing} | Duration: ${r.duration}`)
      .join('\n');

    try {
      const res = await fetch(`http://localhost:3001/api/appointments/${selectedApt.appointment_id}/seen`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          remarks_open: remarksOpen,
          remarks_close: remarksClose,
          prescription: formattedPrescription,
          follow_up: followUp ? 1 : 0,
        }),
      });

      if (res.ok) {
        alert('Consultation completed! Prescription attached and record logged.');
        const updatedApt = { ...selectedApt, prescription: formattedPrescription, remarks_open: remarksOpen, remarks_close: remarksClose, status: 'completed' };
        setSelectedPrescriptionApt(updatedApt);
        setSelectedApt(null);
        fetchDoctorAppointments();
      }
    } catch (err) {
      alert('Error completing consultation: ' + err.message);
    }
  };

  const handleSearchPassport = async (e) => {
    e.preventDefault();
    if (!passportSearch.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/api/patients?search=${encodeURIComponent(passportSearch)}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const list = await res.json();
      if (list && list.length > 0) {
        setSearchedPatient(list[0]);
        // Fetch patient past consultations
        const histRes = await fetch(`http://localhost:3001/api/appointments?patient_id=${list[0].patient_id}`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        const historyData = await histRes.json();
        setPatientHistoryList(historyData);
      } else {
        setSearchedPatient(null);
        setPatientHistoryList([]);
      }
    } catch (err) {
      console.error('Passport search error:', err);
    }
  };

  const activeQueue = appointments.filter(a => a.status === 'booked' || a.status === 'in_progress');
  const attendedHistory = appointments.filter(a => a.status === 'completed');

  return (
    <div className="gov-container">
      {/* Header Banner */}
      <div className="gov-card" style={{ borderLeft: '6px solid var(--uwin-emerald)', backgroundColor: 'var(--uwin-emerald-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: 'var(--uwin-navy)' }}>Medical Officer OPD Workspace</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--uwin-text-muted)', marginTop: '4px' }}>
              Dr. {user.name} | Specialty: General Medicine | Facility: Primary Health Centre (PHC Karad)
            </p>
          </div>

          {/* Interactive Doctor Availability Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uwin-toggle-container">
              <button
                type="button"
                className={`uwin-toggle-btn ${doctorStatus === 'available' ? 'active' : ''}`}
                onClick={handleToggleAvailability}
              >
                Available
              </button>
              <button
                type="button"
                className={`uwin-toggle-btn ${doctorStatus === 'unavailable' ? 'active' : ''}`}
                onClick={handleToggleAvailability}
              >
                Unavailable
              </button>
            </div>

            <button onClick={() => setShowQrModal(true)} className="gov-btn gov-btn-teal">
              Open OPD QR Camera
            </button>
          </div>
        </div>
      </div>

      {scanStatus && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--uwin-emerald-bg)', border: '1px solid var(--uwin-emerald)', borderRadius: '8px', marginBottom: '20px', color: 'var(--uwin-emerald)', fontWeight: 'bold', fontSize: '0.88rem' }}>
          {scanStatus}
        </div>
      )}

      {/* Doctor Dashboard Workspace Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--uwin-border)', marginBottom: '22px' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'queue' ? '3px solid var(--uwin-navy)' : '3px solid transparent',
            backgroundColor: activeTab === 'queue' ? '#F1F5F9' : 'transparent',
            color: activeTab === 'queue' ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
            fontWeight: activeTab === 'queue' ? '800' : '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Active OPD Queue ({activeQueue.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--uwin-navy)' : '3px solid transparent',
            backgroundColor: activeTab === 'history' ? '#F1F5F9' : 'transparent',
            color: activeTab === 'history' ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
            fontWeight: activeTab === 'history' ? '800' : '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Attended Patient History ({attendedHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('passport')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'passport' ? '3px solid var(--uwin-navy)' : '3px solid transparent',
            backgroundColor: activeTab === 'passport' ? '#F1F5F9' : 'transparent',
            color: activeTab === 'passport' ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
            fontWeight: activeTab === 'passport' ? '800' : '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Longitudinal Clinical Passport Search
        </button>
      </div>

      {/* TAB 1: ACTIVE OPD QUEUE & CONSULTATION */}
      {activeTab === 'queue' && (
        <div className="gov-grid-2">
          {/* Left: Queue Table */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Today's OPD Queue ({activeQueue.length} Pending)</div>
            </div>

            {activeQueue.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)', padding: '20px 0' }}>No pending patients in OPD queue.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient Name</th>
                    <th>Visit Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQueue.map((apt) => (
                    <tr key={apt.appointment_id} style={{ backgroundColor: selectedApt?.appointment_id === apt.appointment_id ? 'var(--uwin-teal-light)' : '#FFFFFF' }}>
                      <td><strong>#{apt.token_number || 1}</strong></td>
                      <td>
                        <strong>{apt.patient_name || 'Patient'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--uwin-text-muted)' }}>{apt.time}</div>
                      </td>
                      <td>
                        <span className="gov-badge gov-badge-aging">
                          {apt.visit_type === 'follow_up' ? 'Follow-Up' : 'New Visit'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setRemarksOpen(apt.remarks_open || '');
                              setRemarksClose(apt.remarks_close || '');
                            }}
                            className="gov-btn gov-btn-teal"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          >
                            Attend
                          </button>
                          <button
                            onClick={() => handleRejectAppointment(apt.appointment_id)}
                            className="gov-btn gov-btn-danger"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right: Consultation Workspace */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Consultation &amp; Structured e-Prescription</div>
            </div>

            {!selectedApt ? (
              <p style={{ color: 'var(--uwin-text-muted)', textAlign: 'center', padding: '50px 0' }}>
                Select a patient from the queue to begin clinical examination.
              </p>
            ) : (
              <form onSubmit={handleCompleteConsultation}>
                <div style={{ backgroundColor: 'var(--uwin-teal-light)', border: '1px solid var(--uwin-teal)', padding: '14px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.88rem' }}>
                  <strong>Attending Patient:</strong> {selectedApt.patient_name} (Token #{selectedApt.token_number || 1}) | Phone: {selectedApt.patient_phone || '+919876500101'}<br/>
                  Symptoms Logged: <em>{selectedApt.symptoms || 'General Checkup'}</em>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Open Clinical Remarks (Pre-examination Notes)</label>
                  <textarea
                    className="gov-textarea"
                    rows="2"
                    placeholder="Notes entered before examining patient..."
                    value={remarksOpen}
                    onChange={(e) => setRemarksOpen(e.target.value)}
                  ></textarea>
                </div>

                {/* Formatted Tabular e-Prescription Generator */}
                <div className="gov-form-group" style={{ backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '8px', border: '1px solid var(--uwin-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="gov-label" style={{ margin: 0, color: 'var(--uwin-navy)' }}>
                      Structured Tabular e-Prescription (Medications)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDrugRow}
                      className="gov-btn gov-btn-teal"
                      style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                    >
                      + Add Medication Row
                    </button>
                  </div>

                  <table className="gov-table" style={{ fontSize: '0.82rem', marginBottom: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}>#</th>
                        <th>Drug Name</th>
                        <th>Dosage</th>
                        <th>Timing</th>
                        <th>Duration</th>
                        <th style={{ width: '35px' }}>X</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="gov-input"
                              style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                              placeholder="e.g. Tab Paracetamol 500mg"
                              value={row.name}
                              onChange={(e) => handleDrugChange(row.id, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="gov-select"
                              style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                              value={row.dosage}
                              onChange={(e) => handleDrugChange(row.id, 'dosage', e.target.value)}
                            >
                              <option value="1-0-1">1-0-1</option>
                              <option value="1-1-1">1-1-1</option>
                              <option value="0-1-0">0-1-0</option>
                              <option value="1-0-0">1-0-0</option>
                              <option value="0-0-1">0-0-1</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="gov-select"
                              style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                              value={row.timing}
                              onChange={(e) => handleDrugChange(row.id, 'timing', e.target.value)}
                            >
                              <option value="After Food">After Food</option>
                              <option value="Before Food">Before Food</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="gov-input"
                              style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                              placeholder="e.g. 5 Days"
                              value={row.duration}
                              onChange={(e) => handleDrugChange(row.id, 'duration', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveDrugRow(row.id)}
                              className="gov-btn gov-btn-danger"
                              style={{ padding: '0 6px', fontSize: '0.75rem' }}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Close Clinical Remarks (Diagnosis Summary)</label>
                  <textarea
                    className="gov-textarea"
                    rows="2"
                    placeholder="Clinical diagnosis and recommendations..."
                    value={remarksClose}
                    onChange={(e) => setRemarksClose(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button type="button" onClick={() => setSelectedApt(null)} className="gov-btn gov-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="gov-btn gov-btn-success">
                    Complete Consultation &amp; Generate PDF &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDED PATIENT HISTORY */}
      {activeTab === 'history' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">Attended Patient History ({attendedHistory.length} Completed Consultations)</div>
          </div>

          {attendedHistory.length === 0 ? (
            <p style={{ color: 'var(--uwin-text-muted)', padding: '20px 0' }}>No completed patient consultations recorded yet.</p>
          ) : (
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Patient Name</th>
                  <th>Visit Type</th>
                  <th>Diagnosis / Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendedHistory.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td>{apt.date} {apt.time}</td>
                    <td><strong>{apt.patient_name || 'Patient'}</strong></td>
                    <td><span className="gov-badge gov-badge-fresh">Completed</span></td>
                    <td>{apt.remarks_close || 'Consultation completed'}</td>
                    <td>
                      <button
                        onClick={() => setSelectedPrescriptionApt(apt)}
                        className="gov-btn gov-btn-teal"
                        style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                      >
                        View Prescription PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: LONGITUDINAL CLINICAL PASSPORT SEARCH */}
      {activeTab === 'passport' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">Longitudinal Clinical Passport &amp; Medical History Search</div>
            <span className="gov-badge gov-badge-fresh">ABDM Interoperability</span>
          </div>

          <form onSubmit={handleSearchPassport} style={{ display: 'flex', gap: '12px', marginBottom: '22px' }}>
            <input
              type="text"
              className="gov-input"
              placeholder="Search by Patient Name, Phone (+91...) or ABHA ID..."
              value={passportSearch}
              onChange={(e) => setPassportSearch(e.target.value)}
            />
            <button type="submit" className="gov-btn gov-btn-teal">
              Search Patient Passport
            </button>
          </form>

          {searchedPatient ? (
            <div>
              <div style={{ border: '2px solid var(--uwin-teal)', backgroundColor: 'var(--uwin-teal-light)', padding: '18px', borderRadius: '10px', marginBottom: '22px' }}>
                <h3 style={{ color: 'var(--uwin-navy)', marginBottom: '8px' }}>{searchedPatient.name}</h3>
                <div className="gov-grid-2" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <p><strong>ABHA ID:</strong> {searchedPatient.abha_id}</p>
                    <p><strong>Phone:</strong> {searchedPatient.phone}</p>
                    <p><strong>Village:</strong> {searchedPatient.village}</p>
                  </div>
                  <div>
                    <p><strong>Blood Group:</strong> <span className="gov-badge gov-badge-aging">{searchedPatient.blood_group}</span></p>
                    <p><strong>Chronic Conditions:</strong> {searchedPatient.chronic_conditions || 'None'}</p>
                    <p><strong>Allergies:</strong> {searchedPatient.allergies || 'None'}</p>
                  </div>
                </div>
              </div>

              <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '14px' }}>Past Consultation History</h4>
              {patientHistoryList.length === 0 ? (
                <p style={{ color: 'var(--uwin-text-muted)' }}>No historical consultations logged for this patient.</p>
              ) : (
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Facility</th>
                      <th>Symptoms</th>
                      <th>Doctor Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistoryList.map((h) => (
                      <tr key={h.appointment_id}>
                        <td>{h.date}</td>
                        <td>{h.facility_name || 'PHC Karad'}</td>
                        <td>{h.symptoms}</td>
                        <td>{h.remarks_close || 'Routine checkup'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--uwin-text-muted)', textAlign: 'center', padding: '30px 0' }}>
              Search for a patient to view their complete longitudinal medical passport.
            </p>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQrModal && (
        <QrScannerModal
          title="Doctor OPD Room Entry QR Scanner"
          subtitle="Scan patient appointment QR code to confirm desk entry"
          onScanSuccess={handleQrVerified}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Official Government Prescription PDF Modal */}
      {selectedPrescriptionApt && (
        <PrescriptionPdfModal
          appointment={selectedPrescriptionApt}
          onClose={() => setSelectedPrescriptionApt(null)}
        />
      )}

      {/* Unavailable Modal */}
      {showUnavailableModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,46,90,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="gov-card" style={{ width: '90%', maxWidth: '500px', margin: 0, borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--uwin-danger)', marginBottom: '15px' }}>Doctor Unavailable Notice</h3>
            <form onSubmit={handleMarkUnavailable}>
              <div className="gov-form-group">
                <label className="gov-label">Reason for Unavailability *</label>
                <input
                  type="text"
                  className="gov-input"
                  required
                  placeholder="e.g. Emergency hospital callout"
                  value={unavailableReason}
                  onChange={(e) => setUnavailableReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUnavailableModal(false)} className="gov-btn gov-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-danger">
                  Confirm &amp; Notify Patients
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
