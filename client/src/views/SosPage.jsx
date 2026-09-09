import React, { useState } from 'react';

export default function SosPage() {
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState(null);

  const handleTriggerSOS = () => {
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendEscalation(pos.coords.latitude, pos.coords.longitude),
        () => sendEscalation(17.2860, 74.1833) // Fallback Karad coords
      );
    } else {
      sendEscalation(17.2860, 74.1833);
    }
  };

  const sendEscalation = async (lat, lng) => {
    try {
      const res = await fetch('http://localhost:3001/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, caller_phone: '+919876500000' }),
      });
      const data = await res.json();
      setEscalation(data);
    } catch (err) {
      console.error('SOS error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-container" style={{ maxWidth: '700px' }}>
      <div className="gov-card" style={{ borderTop: '5px solid #C82333' }}>
        <div className="gov-card-header">
          <div className="gov-card-title" style={{ color: '#C82333' }}>Emergency SOS Escalation System</div>
        </div>

        <div style={{ backgroundColor: '#F8D7DA', color: '#721C24', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <strong>Notice (SIH 2026 Protocol):</strong> This emergency escalation system identifies the nearest emergency-accepted facility in Maharashtra and dispatches an emergency escalation ticket to the District Control Desk.
        </div>

        {!escalation ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: '1.05rem', marginBottom: '25px', color: 'var(--gov-text-dark)' }}>
              Press the Emergency SOS Button below if you or a patient requires urgent medical escalation.
            </p>

            <button
              onClick={handleTriggerSOS}
              disabled={loading}
              style={{
                height: '140px',
                width: '140px',
                borderRadius: '50%',
                backgroundColor: '#C82333',
                color: '#FFF',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                border: '4px solid #FFF',
                boxShadow: '0 0 0 4px #C82333, 0 4px 15px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
            >
              {loading ? 'Locating...' : 'EMERGENCY\nSOS'}
            </button>

            <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--gov-text-muted)' }}>
              Uses GPS location to filter facilities accepting emergencies.
            </p>
          </div>
        ) : (
          <div style={{ padding: '15px 0' }}>
            <div style={{ backgroundColor: '#D4EDDA', border: '1px solid #C3E6CB', color: '#155724', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '5px' }}>Escalation Ticket Dispatched</h3>
              <p>Escalation Ticket ID: <strong>{escalation.escalation_ticket_id}</strong></p>
              <p style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
                Escalation ticket sent to: {escalation.facility}
              </p>
              <p style={{ fontSize: '0.82rem', marginTop: '8px', color: '#155724' }}>
                (Simulated emergency ticket dispatch logged in district audit trail)
              </p>
            </div>

            <button onClick={() => setEscalation(null)} className="gov-btn gov-btn-secondary">
              Close / Reset SOS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
