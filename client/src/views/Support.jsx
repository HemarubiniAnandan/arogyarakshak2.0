import React from 'react';
import { Link } from 'react-router-dom';

export default function Support() {
  return (
    <div className="gov-container">
      {/* Page Banner */}
      <div className="gov-card" style={{ background: 'linear-gradient(135deg, #003366 0%, #001A33 100%)', color: '#FFF' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#D4AF37', marginBottom: '10px' }}>
          Government Support &amp; Emergency Helplines
        </h2>
        <p style={{ fontSize: '0.98rem', color: '#E0E8F0', maxWidth: '850px' }}>
          Public Health Department, Government of Maharashtra — Official emergency contact directory, toll-free national health helplines, and district support desks.
        </p>
      </div>

      {/* Emergency Toll-Free Numbers Grid */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">National &amp; State Emergency Helplines</div>
        </div>

        <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="gov-stat-box" style={{ borderLeftColor: '#C82333' }}>
            <div className="gov-stat-number" style={{ color: '#C82333' }}>108</div>
            <div className="gov-stat-label">Maharashtra Emergency Ambulance Service</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
              Free 24x7 emergency medical dispatch, ALS/BLS ambulance response for accident and critical trauma cases.
            </p>
          </div>

          <div className="gov-stat-box" style={{ borderLeftColor: 'var(--gov-blue-primary)' }}>
            <div className="gov-stat-number" style={{ color: 'var(--gov-blue-primary)' }}>104</div>
            <div className="gov-stat-label">National Health Information Helpline</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
              24x7 medical counseling, disease guidance, blood bank status, and PHC center locations.
            </p>
          </div>

          <div className="gov-stat-box" style={{ borderLeftColor: '#E05A10' }}>
            <div className="gov-stat-number" style={{ color: '#E05A10' }}>1098</div>
            <div className="gov-stat-label">Childline Support &amp; Protection</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
              National 24x7 emergency phone service for children in need of care, immunisation, and protection.
            </p>
          </div>

          <div className="gov-stat-box" style={{ borderLeftColor: '#1E7E34' }}>
            <div className="gov-stat-number" style={{ color: '#1E7E34' }}>181</div>
            <div className="gov-stat-label">Maternal &amp; Women Helpline</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
              Maternal health support, institutional delivery transport, and emergency medical assistance for women.
            </p>
          </div>
        </div>
      </div>

      {/* District Technical Support Desks */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">District Technical &amp; Operational Support Desks</div>
        </div>

        <table className="gov-table">
          <thead>
            <tr>
              <th>District / Region</th>
              <th>Support Desk Office</th>
              <th>Contact Phone</th>
              <th>Email Address</th>
              <th>Hours of Operation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Pune District</strong></td>
              <td>District Health Office (DHO), Council Building, Pune</td>
              <td>+91 20 2612 3456</td>
              <td>dho.pune@maharashtra.gov.in</td>
              <td>09:00 AM – 06:00 PM</td>
            </tr>
            <tr>
              <td><strong>Nagpur District</strong></td>
              <td>District Civil Hospital Command Desk, Nagpur</td>
              <td>+91 712 2567 890</td>
              <td>dho.nagpur@maharashtra.gov.in</td>
              <td>09:00 AM – 06:00 PM</td>
            </tr>
            <tr>
              <td><strong>Nashik District</strong></td>
              <td>District Health Society Office, Old Agra Road, Nashik</td>
              <td>+91 253 2345 678</td>
              <td>dho.nashik@maharashtra.gov.in</td>
              <td>09:00 AM – 06:00 PM</td>
            </tr>
            <tr>
              <td><strong>Aurangabad (Chhatrapati Sambhajinagar)</strong></td>
              <td>PHC Control Desk, Government Medical College, Chhatrapati Sambhajinagar</td>
              <td>+91 240 2451 123</td>
              <td>dho.aurangabad@maharashtra.gov.in</td>
              <td>09:00 AM – 06:00 PM</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Immediate Emergency Action Banner */}
      <div className="gov-card" style={{ borderLeft: '4px solid #C82333', backgroundColor: '#FFF5F5' }}>
        <h4 style={{ color: '#C82333', marginBottom: '8px' }}>Critical Medical Emergency?</h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-dark)', marginBottom: '15px' }}>
          If a patient requires immediate emergency dispatch, click below to launch the automated GPS-based Emergency SOS Escalation tool.
        </p>
        <Link to="/sos" className="gov-btn gov-btn-danger">
          Launch Emergency SOS Escalation
        </Link>
      </div>
    </div>
  );
}
