import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SimulatedBadge from '../components/SimulatedBadge';
import AppointmentTrackerStepper from '../components/AppointmentTrackerStepper';
import PrescriptionPdfModal from '../components/PrescriptionPdfModal';

export default function PatientDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('appointments');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrescriptionApt, setSelectedPrescriptionApt] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Find patient record by listing backend patients
      const res = await fetch('http://localhost:3001/api/patients', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const list = await res.json();
      const current = list[0] || null;

      if (current) {
        const detailRes = await fetch(`http://localhost:3001/api/patients/${current.patient_id}`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        const detail = await detailRes.json();
        setPatientData(detail);
      }
    } catch (err) {
      console.error('Patient dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="gov-container"><p>Loading patient care passport &amp; appointments...</p></div>;
  }

  return (
    <div className="gov-container">
      {/* Welcome Banner */}
      <div className="gov-card" style={{ borderLeft: '6px solid var(--gov-blue-primary)', backgroundColor: 'var(--gov-blue-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: 'var(--gov-blue-dark)' }}>
              Namaskar, {patientData?.name || user.name}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
              Patient ID: <strong>{patientData?.patient_id || 'PATIENT-DEMO-001'}</strong> | ABHA ID: <strong>{patientData?.abha_id || 'ABHA-SYNTH-001'}</strong> | Village: <strong>{patientData?.village || 'Umbraj'}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/patient/book" className="gov-btn gov-btn-primary">
              + Book New Appointment
            </Link>
            <Link to="/patient/vaccination" className="gov-btn gov-btn-success">
              + Book Vaccination Slot
            </Link>
          </div>
        </div>
      </div>

      {/* ABDM Interoperability Badge Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px 16px', background: '#FFF', border: '1px solid var(--gov-border)', borderRadius: '6px' }}>
        <span style={{ fontSize: '0.88rem' }}>
          <strong>ABDM Longitudinal Care Passport:</strong> Health records linked with FHIR interoperability standard.
        </span>
        <SimulatedBadge adapterName="ABDM adapter" />
      </div>

      {/* Tabs Layout */}
      <div className="gov-card">
        <div style={{ display: 'flex', gap: '5px', borderBottom: '2px solid var(--gov-border)', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { id: 'appointments', label: 'Appointments & Progress Stepper' },
            { id: 'vaccination', label: 'Vaccination Tracker (U-WIN)' },
            { id: 'chronic', label: 'Chronic Care & Readings' },
            { id: 'details', label: 'Personal & Medical Profile' },
            { id: 'prescriptions', label: 'Prescriptions & PDF Extractor' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--gov-blue-primary)' : '3px solid transparent',
                backgroundColor: activeTab === tab.id ? 'var(--gov-blue-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--gov-blue-primary)' : 'var(--gov-text-dark)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Appointments with Amazon Progress Stepper */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--gov-blue-primary)', margin: 0 }}>My Appointments &amp; OPD Journey Status</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)' }}>Real-time Amazon shipping-style progress stepper for each appointment ticket.</p>
              </div>
              <Link to="/patient/book" className="gov-btn gov-btn-primary" style={{ fontSize: '0.82rem' }}>
                + Book New Appointment
              </Link>
            </div>

            {(!patientData?.appointments || patientData.appointments.length === 0) ? (
              <p style={{ color: 'var(--gov-text-muted)', padding: '20px 0' }}>No appointment records found in database.</p>
            ) : (
              patientData.appointments.map(apt => (
                <div key={apt.appointment_id} style={{ border: '1px solid var(--gov-border)', borderRadius: '8px', padding: '16px', marginBottom: '20px', backgroundColor: '#FFFFFF', boxShadow: 'var(--gov-shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ color: 'var(--gov-blue-primary)', margin: 0 }}>
                        Token #{apt.token_number || 1} — {apt.doctor_name || 'Assigned Medical Officer'}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                        Facility: <strong>{apt.facility_name || 'PHC Karad'}</strong> | Date: <strong>{apt.date} at {apt.time}</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                        Referral / Appointment ID: <strong>{apt.appointment_id}</strong>
                      </p>
                      {apt.symptoms && (
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                          Symptoms: <em>{apt.symptoms}</em>
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {apt.prescription && (
                        <button
                          onClick={() => setSelectedPrescriptionApt(apt)}
                          className="gov-btn gov-btn-success"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          Export / Download PDF Prescription
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Amazon Shipping-Style Progress Stepper */}
                  <AppointmentTrackerStepper appointment={apt} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Vaccination */}
        {activeTab === 'vaccination' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>Vaccination Tracker (U-WIN Synchronized)</h3>
              <SimulatedBadge adapterName="U-WIN adapter" />
            </div>

            {(!patientData?.children || patientData.children.length === 0) ? (
              <p style={{ color: 'var(--gov-text-muted)' }}>No child beneficiary records linked to this profile.</p>
            ) : (
              patientData.children.map(child => (
                <div key={child.beneficiary_id} style={{ border: '1px solid var(--gov-border)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4>Beneficiary ID: {child.beneficiary_id} (DOB: {child.dob})</h4>
                  <p style={{ fontSize: '0.88rem', margin: '5px 0' }}>
                    Due Vaccines: <strong>{child.vaccine_due || 'All up to date'}</strong> | U-WIN Sync: <span className="gov-badge gov-badge-fresh">{child.uwin_sync_status}</span>
                  </p>
                  <Link to="/patient/vaccination" className="gov-btn gov-btn-success" style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.8rem' }}>
                    Schedule Vaccination Slot
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Chronic Care */}
        {activeTab === 'chronic' && (
          <div>
            <h3>Chronic Condition Monitoring</h3>
            {(!patientData?.chronic || patientData.chronic.length === 0) ? (
              <p style={{ color: 'var(--gov-text-muted)', marginTop: '10px' }}>No chronic case readings logged.</p>
            ) : (
              <table className="gov-table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Reading Value</th>
                    <th>Reading Date</th>
                    <th>Threshold Status</th>
                    <th>Adherence Gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {patientData.chronic.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.condition}</strong></td>
                      <td>{c.reading_value}</td>
                      <td>{c.reading_date}</td>
                      <td>
                        {c.threshold_breached ? (
                          <span className="gov-badge gov-badge-stale">THRESHOLD BREACHED</span>
                        ) : (
                          <span className="gov-badge gov-badge-fresh">NORMAL</span>
                        )}
                      </td>
                      <td>{c.adherence_gap_count} gap(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 4: Personal & Medical Profile */}
        {activeTab === 'details' && (
          <div className="gov-grid-2">
            <div style={{ backgroundColor: '#FAFBFD', padding: '16px', borderRadius: '8px', border: '1px solid var(--gov-border)' }}>
              <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '12px' }}>Demographic Information</h4>
              <p><strong>Full Name:</strong> {patientData?.name}</p>
              <p><strong>Phone Number:</strong> {patientData?.phone || 'N/A'}</p>
              <p><strong>Village:</strong> {patientData?.village}</p>
              <p><strong>Guardian Name:</strong> {patientData?.guardian_name || 'N/A'}</p>
              <p><strong>Guardian Contact:</strong> {patientData?.guardian_contact || 'N/A'}</p>
              <p><strong>Communication Pref:</strong> {patientData?.communication_preference?.toUpperCase()}</p>
              <p><strong>Address:</strong> {patientData?.address || 'N/A'}</p>
            </div>

            <div style={{ backgroundColor: '#FAFBFD', padding: '16px', borderRadius: '8px', border: '1px solid var(--gov-border)' }}>
              <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '12px' }}>Medical Profile &amp; History (eSanjeevani)</h4>
              <p><strong>Blood Group:</strong> <span className="gov-badge gov-badge-aging">{patientData?.blood_group || 'N/A'}</span></p>
              <p><strong>Age / DOB:</strong> {patientData?.age || 'N/A'} yrs ({patientData?.dob || 'N/A'})</p>
              <p><strong>Chronic Conditions:</strong> {patientData?.chronic_conditions || 'None reported'}</p>
              <p><strong>Known Allergies:</strong> <span style={{ color: patientData?.allergies ? '#C82333' : 'inherit', fontWeight: 'bold' }}>{patientData?.allergies || 'None'}</span></p>
              <p><strong>Past Medications &amp; Dosages:</strong> {patientData?.past_medications || 'None'}</p>
              <p><strong>Disability / Mobility Notes:</strong> {patientData?.disability || 'None'}</p>
            </div>
          </div>
        )}

        {/* Tab 5: Digital Prescriptions & PDF Extractor */}
        {activeTab === 'prescriptions' && (
          <div>
            <h3>Medical Prescriptions &amp; Official PDF Extractor</h3>
            {patientData?.appointments?.filter(a => a.prescription).map(apt => (
              <div key={apt.appointment_id} style={{ border: '1px solid var(--gov-border)', padding: '16px', borderRadius: '8px', marginTop: '12px', backgroundColor: '#FFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Date:</strong> {apt.date} | <strong>Doctor:</strong> {apt.doctor_name || 'Medical Officer'}
                  </div>
                  <button onClick={() => setSelectedPrescriptionApt(apt)} className="gov-btn gov-btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                    Open Official e-Prescription PDF
                  </button>
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.92rem', color: 'var(--gov-blue-dark)' }}>
                  <strong>Prescribed Medications:</strong><br/>
                  <span style={{ whiteSpace: 'pre-line' }}>{apt.prescription}</span>
                </p>
              </div>
            )) || <p style={{ color: 'var(--gov-text-muted)', marginTop: '10px' }}>No digital prescriptions logged yet.</p>}
          </div>
        )}
      </div>

      {/* Official Government Prescription PDF Modal */}
      {selectedPrescriptionApt && (
        <PrescriptionPdfModal
          appointment={selectedPrescriptionApt}
          onClose={() => setSelectedPrescriptionApt(null)}
        />
      )}
    </div>
  );
}
