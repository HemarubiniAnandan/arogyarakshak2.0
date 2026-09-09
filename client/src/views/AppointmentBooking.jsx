import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

export default function AppointmentBooking({ user }) {
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);

  // Step 2 Form — Interactive Toggle Switch for Visit Type
  const [visitType, setVisitType] = useState('new');
  const [mobilityNeeds, setMobilityNeeds] = useState('can_stand');
  const [symptoms, setSymptoms] = useState('');
  const [homeVisit, setHomeVisit] = useState(false);

  // Step 3 Triage Result
  const [triageResult, setTriageResult] = useState(null);

  // Step 4 Doctor selection
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Step 5 Slot Selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking Result & QR Data URL
  const [bookingResult, setBookingResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/patients', {
      headers: { 'Authorization': `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((list) => {
        if (list && list.length > 0) setPatient(list[0]);
      })
      .catch(() => {});
  }, [user]);

  const handleRunTriage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          patientContext: {
            age: patient?.age,
            thresholdBreached: false,
          },
        }),
      });
      const data = await res.json();
      setTriageResult(data);

      fetchDoctors(data.suggested_specialty);
      setStep(3);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (specialty) => {
    try {
      const res = await fetch(`http://localhost:3001/api/appointments/doctors/available?specialty=${specialty || ''}&home_visit=${homeVisit ? '1' : ''}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const docs = await res.json();
      if (Array.isArray(docs)) {
        setAvailableDoctors(docs);
      } else {
        setAvailableDoctors([]);
        console.error('API returned non-array:', docs);
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setAvailableDoctors([]);
    }
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    fetchSlots(doc.doctor_id, selectedDate);
    setStep(4);
  };

  const fetchSlots = async (docId, dateStr) => {
    try {
      const res = await fetch(`http://localhost:3001/api/appointments/slots/${docId}/${dateStr}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const slots = await res.json();
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Fetch slots error:', err);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const body = {
        patient_id: patient?.patient_id || 'PATIENT-DEMO-001',
        doctor_id: selectedDoctor.doctor_id,
        facility_id: selectedDoctor.facility_id,
        date: selectedDate,
        time: selectedSlot.slot,
        visit_type: visitType,
        mobility_needs: mobilityNeeds,
        home_visit: homeVisit ? 1 : 0,
        symptoms,
        triage_pathway: triageResult?.pathway,
        triage_risk: triageResult?.risk_level,
      };

      const res = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed.');

      // Generate QR Code data URL
      const qrPayload = JSON.stringify({
        appointment_id: data.appointment_id,
        token_number: data.token_number,
        patient_name: patient?.name || user.name,
        facility: selectedDoctor.facility_name,
        doctor: selectedDoctor.name,
        date: selectedDate,
        time: selectedSlot.slot,
      });

      QRCode.toDataURL(qrPayload, { width: 220, margin: 2 }, (err, url) => {
        if (!err) setQrDataUrl(url);
      });

      const phone = patient?.phone || '+919876500040';
      const smsBody = `AarogyaRakshak Booking Confirmed! Token #${data.token_number} at ${selectedDoctor.facility_name} on ${selectedDate} at ${selectedSlot.slot}. Doctor: ${selectedDoctor.name}.`;
      await fetch('http://localhost:3001/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, body: smsBody }),
      });

      const voiceMsg = `Namaskar ${patient?.name || 'Citizen'}, aapka appointment Dr. ${selectedDoctor.name} ke saath ${selectedDate} ko samay ${selectedSlot.slot} par confirm ho gaya hai. Token number ${data.token_number} hai. Dhanyavaad.`;
      await fetch('http://localhost:3001/api/notifications/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message: voiceMsg, language: 'hi-IN' }),
      });

      setBookingResult(data);
      setStep(6);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-container" style={{ maxWidth: '850px' }}>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Smart Appointment Booking Portal</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)' }}>Step {step} of 6</div>
        </div>

        {/* Profile Autofill Banner */}
        <div style={{ backgroundColor: 'var(--uwin-teal-light)', border: '1px solid var(--uwin-teal)', padding: '14px', borderRadius: '8px', marginBottom: '22px', fontSize: '0.88rem' }}>
          <strong>Autofilled Patient Record:</strong> {patient?.name || user.name} | Age: {patient?.age || '45'} | Blood Group: <span className="gov-badge gov-badge-aging">{patient?.blood_group || 'O+'}</span> | Chronic: {patient?.chronic_conditions || 'None'} | Allergies: {patient?.allergies || 'None'}
        </div>

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleRunTriage}>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '16px' }}>Step 2 — Consultation Details &amp; Symptoms</h4>

            <div className="gov-grid-2" style={{ alignItems: 'center' }}>
              <div className="gov-form-group">
                <label className="gov-label">Visit Type Category *</label>
                {/* Interactive Toggle Switch replacing dropdown */}
                <div className="uwin-toggle-container">
                  <button
                    type="button"
                    className={`uwin-toggle-btn ${visitType === 'new' ? 'active' : ''}`}
                    onClick={() => setVisitType('new')}
                  >
                    New Patient Visit
                  </button>
                  <button
                    type="button"
                    className={`uwin-toggle-btn ${visitType === 'follow_up' ? 'active' : ''}`}
                    onClick={() => setVisitType('follow_up')}
                  >
                    Follow-Up Visit
                  </button>
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">Patient Mobility Needs</label>
                <select className="gov-select" value={mobilityNeeds} onChange={(e) => setMobilityNeeds(e.target.value)}>
                  <option value="can_stand">Can walk / stand independently</option>
                  <option value="needs_wheelchair">Needs Wheelchair assistance</option>
                  <option value="stretcher">Stretcher support required</option>
                  <option value="ambulance">Emergency Ambulance transport needed</option>
                </select>
              </div>
            </div>

            <div className="gov-form-group">
              <label className="gov-label">Describe Symptoms or Health Issue *</label>
              <textarea
                className="gov-textarea"
                rows="3"
                required
                placeholder="e.g. High fever for 3 days, severe headache, breathing difficulty..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              ></textarea>
            </div>

            <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="homeVisit"
                checked={homeVisit}
                onChange={(e) => setHomeVisit(e.target.checked)}
              />
              <label htmlFor="homeVisit" className="gov-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Request Home Visit (Searches doctors flagged for home visits using patient's village address)
              </label>
            </div>

            <button type="submit" className="gov-btn gov-btn-teal" style={{ marginTop: '15px' }} disabled={loading}>
              {loading ? 'Running Triage Assist...' : 'Run Smart Triage Assist ->'}
            </button>
          </form>
        )}

        {/* Step 3: Triage Result */}
        {step === 3 && triageResult && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>Step 3 — Smart Triage Assist Output</h4>
            <div style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #D97706', padding: '12px 16px', borderRadius: '4px', marginBottom: '18px', fontSize: '0.85rem' }}>
              Rule-based Triage Assist: This system assists routing based on Maharashtra health protocol rules.
            </div>

            <div className="gov-grid-2" style={{ marginBottom: '20px' }}>
              <div className="gov-stat-box">
                <div className="gov-stat-label">Suggested Pathway</div>
                <div className="gov-stat-number" style={{ fontSize: '1.4rem' }}>{triageResult.pathway.toUpperCase()}</div>
              </div>
              <div className="gov-stat-box" style={{ borderLeftColor: triageResult.risk_level === 'emergency' ? 'var(--uwin-danger)' : 'var(--uwin-emerald)' }}>
                <div className="gov-stat-label">Assessed Risk Level</div>
                <div className="gov-stat-number" style={{ fontSize: '1.4rem', color: triageResult.risk_level === 'emergency' ? 'var(--uwin-danger)' : 'var(--uwin-emerald)' }}>
                  {triageResult.risk_level.toUpperCase()}
                </div>
              </div>
            </div>

            <h5>Rule Match Explanation:</h5>
            <ul style={{ paddingLeft: '20px', margin: '10px 0 20px 0', fontSize: '0.88rem' }}>
              {triageResult.matched_rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>

            <button onClick={() => setStep(4)} className="gov-btn gov-btn-teal">
              View Ranked Matching Doctors &rarr;
            </button>
          </div>
        )}

        {/* Step 4: Doctors Selection */}
        {(step === 4 || (step === 3 && availableDoctors.length > 0)) && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>Step 4 — Available Doctors (Ranked by Match, Distance &amp; Readiness)</h4>

            {availableDoctors.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)' }}>No doctors available for this criteria right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {availableDoctors.map((doc) => (
                  <div key={doc.doctor_id} style={{ border: '1px solid var(--uwin-border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: selectedDoctor?.doctor_id === doc.doctor_id ? 'var(--uwin-teal-light)' : '#FFFFFF' }}>
                    <div>
                      <h4 style={{ color: 'var(--uwin-navy)' }}>{doc.name} ({doc.specialty})</h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--uwin-text-muted)', marginTop: '4px' }}>
                        Facility: <strong>{doc.facility_name}</strong> | Readiness Score: <strong>{doc.readiness_score}/10</strong> | Exp: {doc.years_experience || 5} yrs {doc.home_visit ? ' | Home Visit Available' : ''}
                      </p>
                    </div>
                    <button onClick={() => handleSelectDoctor(doc)} className="gov-btn gov-btn-teal">
                      Select Doctor &amp; View Slots &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Calendar Date & Slot Picker with Booked Slots Disabled */}
        {step === 4 && selectedDoctor && (
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid var(--uwin-border)' }}>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>Step 5 — Select Date &amp; Time Slot</h4>

            <div className="gov-form-group" style={{ maxWidth: '300px' }}>
              <label className="gov-label">Consultation Date</label>
              <input
                type="date"
                className="gov-input"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchSlots(selectedDoctor.doctor_id, e.target.value);
                }}
              />
            </div>

            <h5>Available Slots for Dr. {selectedDoctor.name}:</h5>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
              {availableSlots.length === 0 ? (
                <p style={{ color: 'var(--uwin-text-muted)', fontSize: '0.88rem' }}>No slots found for selected date.</p>
              ) : (
                availableSlots.map((s) => {
                  const isBooked = s.status !== 'available';
                  return (
                    <button
                      key={s.id}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(s)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        border: selectedSlot?.id === s.id ? '2px solid var(--uwin-navy)' : '1px solid var(--uwin-border)',
                        backgroundColor: isBooked ? '#F1F5F9' : selectedSlot?.id === s.id ? 'var(--uwin-navy)' : '#FFFFFF',
                        color: isBooked ? '#94A3B8' : selectedSlot?.id === s.id ? '#FFFFFF' : 'var(--uwin-text-dark)',
                        cursor: isBooked ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        opacity: isBooked ? 0.6 : 1,
                      }}
                    >
                      {s.slot} {isBooked ? '(Booked)' : ''}
                    </button>
                  );
                })
              )}
            </div>

            {selectedSlot && (
              <button onClick={() => setStep(5)} className="gov-btn gov-btn-success" style={{ marginTop: '10px' }}>
                Proceed to Confirmation &rarr;
              </button>
            )}
          </div>
        )}

        {/* Step 6: Confirmation Screen */}
        {step === 5 && selectedDoctor && selectedSlot && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>Step 6 — Double-Confirm Appointment Booking</h4>

            <div style={{ border: '2px solid var(--uwin-navy)', padding: '20px', borderRadius: '8px', backgroundColor: '#F8FAFC', marginBottom: '20px' }}>
              <p><strong>Patient Name:</strong> {patient?.name || user.name}</p>
              <p><strong>Assigned Doctor:</strong> {selectedDoctor.name} ({selectedDoctor.specialty})</p>
              <p><strong>Health Facility:</strong> {selectedDoctor.facility_name}</p>
              <p><strong>Date &amp; Time:</strong> {selectedDate} at {selectedSlot.slot}</p>
              <p><strong>Visit Type:</strong> <span className="gov-badge gov-badge-aging">{visitType === 'new' ? 'NEW VISIT' : 'FOLLOW-UP VISIT'}</span> | Mobility: {mobilityNeeds.replace('_', ' ')}</p>
              <p><strong>Symptoms Logged:</strong> {symptoms}</p>
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--uwin-text-muted)' }}>
                On confirmation, an SMS token with QR link and an automated voice call confirmation will be dispatched to <strong>{patient?.phone || '+919876500040'}</strong> via notification adapter.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setStep(4)} className="gov-btn gov-btn-secondary">&lt;- Back to Slot Selection</button>
              <button onClick={handleConfirmBooking} className="gov-btn gov-btn-success" disabled={loading}>
                {loading ? 'Locking Booking & Dispatching Notifications...' : 'Confirm & Lock Appointment'}
              </button>
            </div>
          </div>
        )}

        {/* Final Booking Success with Generated Visual QR Code */}
        {step === 6 && bookingResult && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3 style={{ color: 'var(--uwin-navy)', marginBottom: '10px' }}>Appointment Successfully Booked!</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
              Token Number: <strong style={{ color: 'var(--uwin-teal)', fontSize: '1.4rem' }}>#{bookingResult.token_number}</strong> | Appointment ID: <strong>{bookingResult.appointment_id}</strong>
            </p>

            {/* Graphical QR Code */}
            {qrDataUrl && (
              <div style={{ margin: '20px 0' }}>
                <img src={qrDataUrl} alt="Appointment QR Code" style={{ border: '2px solid var(--uwin-navy)', padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: 'var(--uwin-shadow-md)' }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '6px' }}>
                  Show or print this QR Code at the PHC reception desk for instant check-in.
                </p>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--uwin-emerald-bg)', color: 'var(--uwin-emerald)', padding: '14px', borderRadius: '8px', display: 'inline-block', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Automated SMS token and voice confirmation dispatched via Twilio integration adapter!
            </div>

            <div>
              <button onClick={() => navigate('/patient')} className="gov-btn gov-btn-teal">
                Return to Patient Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

