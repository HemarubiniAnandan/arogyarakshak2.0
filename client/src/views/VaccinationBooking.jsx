import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimulatedBadge from '../components/SimulatedBadge';

export default function VaccinationBooking({ user }) {
  const [schedule, setSchedule] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState('Pentavalent-1');
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/child/vaccine/schedule', {
      headers: { 'Authorization': `Bearer ${user.token}` },
    })
      .then(res => res.json())
      .then(data => setSchedule(data))
      .catch(() => {});

    fetch('http://localhost:3001/api/facilities')
      .then(res => res.json())
      .then(data => {
        setFacilities(data);
        if (data.length > 0) setSelectedFacility(data[0].facility_id);
      })
      .catch(() => {});
  }, [user]);

  const handleBookVaccination = async (e) => {
    e.preventDefault();

    // Trigger Twilio notification
    const phone = '+919876500040';
    await fetch('http://localhost:3001/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        body: `U-WIN Vaccination Slot Booked! Vaccine: ${selectedVaccine} on ${date} at nearest PHC. Token #V-${Math.floor(Math.random()*100)}`,
      }),
    });

    await fetch('http://localhost:3001/api/notifications/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        message: `Namaskar, aapka ${selectedVaccine} teeka lagwane ka samay ${date} ko confirm ho gaya hai. Dhanyavaad.`,
        language: 'hi-IN',
      }),
    });

    setConfirmed(true);
  };

  return (
    <div className="gov-container" style={{ maxWidth: '750px' }}>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Child Immunisation Slot Booking (U-WIN Synchronized)</div>
          <SimulatedBadge adapterName="U-WIN adapter" />
        </div>

        {!confirmed ? (
          <form onSubmit={handleBookVaccination}>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-muted)', marginBottom: '20px' }}>
              Select due vaccine from the National Immunisation Schedule to book a slot at your local Primary Health Centre.
            </p>

            <div className="gov-form-group">
              <label className="gov-label">Select Vaccine Type</label>
              <select className="gov-select" value={selectedVaccine} onChange={(e) => setSelectedVaccine(e.target.value)}>
                <option value="OPV-1">OPV-1 (Oral Polio Vaccine - 1st dose)</option>
                <option value="Pentavalent-1">Pentavalent-1 (DPT + Hep-B + Hib)</option>
                <option value="Rotavirus-1">Rotavirus-1</option>
                <option value="Measles-1">Measles / MR 1st Dose</option>
                <option value="DPT-Booster-1">DPT Booster 1</option>
                <option value="BCG">BCG Birth Dose</option>
              </select>
            </div>

            <div className="gov-form-group">
              <label className="gov-label">Preferred Health Facility / PHC</label>
              <select className="gov-select" value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)}>
                {facilities.map(f => (
                  <option key={f.facility_id} value={f.facility_id}>{f.name} ({f.type})</option>
                ))}
              </select>
            </div>

            <div className="gov-form-group">
              <label className="gov-label">Preferred Vaccination Date</label>
              <input
                type="date"
                className="gov-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" onClick={() => navigate('/patient')} className="gov-btn gov-btn-secondary">
                Back to Dashboard
              </button>
              <button type="submit" className="gov-btn gov-btn-success">
                Book Vaccination &amp; Dispatch Notifications ->
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3 style={{ color: 'var(--gov-blue-primary)', marginBottom: '10px' }}>Vaccination Slot Confirmed!</h3>
            <p>Vaccine: <strong>{selectedVaccine}</strong> | Date: <strong>{date}</strong></p>
            <p style={{ color: 'var(--gov-text-muted)', margin: '15px 0' }}>
              SMS token and voice confirmation dispatched via Twilio sandbox adapter.
            </p>
            <button onClick={() => navigate('/patient')} className="gov-btn gov-btn-primary">
              Return to Patient Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
