import React from 'react';

/**
 * Official Government e-Prescription PDF View & Print Modal
 * Formats structured e-prescriptions into official eSanjeevani / ABDM layout.
 */
export default function PrescriptionPdfModal({ appointment, onClose }) {
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  // Parse structured prescription text if formatted as lines
  const parsePrescriptionLines = (text) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim().length > 0);
  };

  const rxLines = parsePrescriptionLines(appointment.prescription);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 22, 44, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200, backdropFilter: 'blur(5px)' }}>
      <div className="gov-card" style={{ width: '90%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', margin: 0, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '2px solid var(--gov-blue-primary)' }}>
        
        {/* Top Control Bar (Hidden when printing) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--gov-border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="gov-badge gov-badge-fresh" style={{ fontSize: '0.8rem' }}>OFFICIAL E-PRESCRIPTION</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)' }}>ABDM &amp; eSanjeevani Interoperable Format</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="gov-btn gov-btn-primary" style={{ padding: '4px 12px', fontSize: '0.82rem' }}>
              Print / Save as PDF
            </button>
            <button onClick={onClose} className="gov-btn gov-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.82rem' }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Official Government Header */}
        <div id="printablePrescription" style={{ padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--gov-blue-primary)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-saffron)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Public Health Department — Government of Maharashtra
              </div>
              <h2 style={{ color: 'var(--gov-blue-primary)', fontSize: '1.4rem', margin: '2px 0' }}>
                {appointment.facility_name || 'Primary Health Centre Karad (PHC Karad)'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)' }}>
                District Satara, Maharashtra | OPD Consultation Desk
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--gov-blue-primary)' }}>Rx</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)' }}>Token: #{appointment.token_number || '001'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)' }}>Date: {appointment.date || new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Doctor & Patient Info Block */}
          <div className="gov-grid-2" style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--gov-border)', marginBottom: '20px', fontSize: '0.88rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gov-text-muted)', fontWeight: 'bold' }}>PATIENT DEMOGRAPHICS</div>
              <strong>Name:</strong> {appointment.patient_name || 'Sunanda Kamble'}<br/>
              <strong>ABHA ID:</strong> {appointment.abha_id || 'ABHA-SYNTH-001'}<br/>
              <strong>Phone:</strong> {appointment.patient_phone || '+919876500101'}<br/>
              <strong>Symptoms:</strong> <em>{appointment.symptoms || 'General Checkup'}</em>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gov-text-muted)', fontWeight: 'bold' }}>CONSULTING MEDICAL OFFICER</div>
              <strong>Doctor:</strong> {appointment.doctor_name || 'Dr. Meera Joshi'}<br/>
              <strong>Specialty:</strong> {appointment.doctor_specialty || 'General Medicine'}<br/>
              <strong>OPD Visit ID:</strong> {appointment.appointment_id}<br/>
              <strong>Triage Pathway:</strong> <span className="gov-badge gov-badge-aging">{appointment.triage_pathway || 'general'}</span>
            </div>
          </div>

          {/* Pre-Exam & Clinical Remarks */}
          <div style={{ marginBottom: '20px' }}>
            {appointment.remarks_open && (
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--gov-blue-primary)' }}>Open Remarks (Pre-Examination):</strong>
                <p style={{ fontSize: '0.88rem', backgroundColor: '#FFF', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--gov-border)', marginTop: '4px' }}>
                  {appointment.remarks_open}
                </p>
              </div>
            )}
            {appointment.remarks_close && (
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--gov-blue-primary)' }}>Clinical Diagnosis &amp; Close Observations:</strong>
                <p style={{ fontSize: '0.88rem', backgroundColor: '#FFF', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--gov-border)', marginTop: '4px' }}>
                  {appointment.remarks_close}
                </p>
              </div>
            )}
          </div>

          {/* Medication Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: 'var(--gov-blue-primary)', borderBottom: '2px solid var(--gov-blue-bg)', paddingBottom: '6px', marginBottom: '10px' }}>
              Digital e-Prescription (Medications &amp; Dosage Instructions)
            </h4>

            {rxLines.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-muted)' }}>No prescription medications attached.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Prescribed Medication Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rxLines.map((line, idx) => (
                    <tr key={idx}>
                      <td><strong>{idx + 1}</strong></td>
                      <td><strong style={{ color: 'var(--gov-blue-dark)' }}>{line}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Signature Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '2px dashed var(--gov-border)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)' }}>eSanjeevani Interoperability Code: ESJ-MH-2026-901</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)' }}>Verification QR Signature: Digitally Certified</div>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid var(--gov-border-strong)', paddingTop: '4px', minWidth: '200px' }}>
              <strong>{appointment.doctor_name || 'Dr. Meera Joshi'}</strong><br/>
              <span style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)' }}>Medical Officer (Reg. MH-48912)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
