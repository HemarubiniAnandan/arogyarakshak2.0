import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#001A33', color: '#B0C4DE', borderTop: '4px solid var(--gov-saffron)', marginTop: '40px', padding: '30px 0 20px 0', fontSize: '0.85rem' }}>
      <div className="gov-container">
        <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '10px' }}>AarogyaRakshak 2.0 Portal</h4>
            <p style={{ color: '#8A9EA8', lineHeight: '1.5' }}>
              Public Health Department, Government of Maharashtra.<br />
              Offline-first digital healthcare continuity platform for rural primary health centres and community care.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '10px' }}>Emergency Helplines</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
              <li><strong>108</strong> — National Ambulance Service</li>
              <li><strong>104</strong> — Health Information &amp; Advice</li>
              <li><strong>1098</strong> — Child Helpline</li>
              <li><strong>181</strong> — Women Helpline</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '10px' }}>Governance Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
              <li><Link to="/about" style={{ color: '#B0C4DE', textDecoration: 'none' }}>About System Architecture</Link></li>
              <li><Link to="/support" style={{ color: '#B0C4DE', textDecoration: 'none' }}>District Help Desk Roster</Link></li>
              <li><Link to="/faq" style={{ color: '#B0C4DE', textDecoration: 'none' }}>Frequently Asked Questions</Link></li>
              <li><Link to="/sos" style={{ color: '#FF6B6B', textDecoration: 'none', fontWeight: 'bold' }}>Emergency SOS Escalation</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', textAlign: 'center', color: '#6C7D8C', fontSize: '0.8rem' }}>
          Content Managed by Public Health Department, Government of Maharashtra &copy; {new Date().getFullYear()}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
