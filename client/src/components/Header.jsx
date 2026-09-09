import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }));
  };

  return (
    <header style={{ borderBottom: '1px solid var(--uwin-border)' }}>
      {/* Top Tricolor Strip */}
      <div className="gov-tricolor-strip"></div>

      {/* Top Accessibility Bar */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-left">
          <span>Government of Maharashtra — Public Health Department</span>
          <span>National Health Mission (U-WIN Portal)</span>
        </div>

        <div className="gov-top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 'bold' }}>Language:</span>
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                backgroundColor: 'var(--uwin-navy-dark)',
                color: '#FFFFFF',
                border: '1px solid var(--uwin-teal)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <button>A-</button>
            <button>A</button>
            <button>A+</button>
          </div>
        </div>
      </div>

      {/* Main U-WIN Government Header */}
      <div className="gov-header">
        <div className="gov-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* AarogyaRakshak Official Logo */}
            <img 
              src="/aarogya-logo.jpg" 
              alt="AarogyaRakshak Logo" 
              style={{ height: '56px', width: '56px', objectFit: 'cover', borderRadius: '50%', backgroundColor: '#FFFFFF', padding: '2px', border: '2px solid #D4AF37', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback pattern if image is missing */}
            <div style={{ display: 'none', width: '56px', height: '56px', backgroundColor: '#FFFFFF', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', padding: '2px', border: '2px solid #D4AF37', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
              <span style={{color: '#0F2E5A', fontWeight: 'bold', fontSize: '10px'}}>LOGO 1</span>
            </div>

            {/* Ministry of Health & Family Welfare Logo */}
            <img 
              src="/mohfw-logo.jpg" 
              alt="MoHFW Logo" 
              style={{ height: '46px', objectFit: 'contain' }} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback pattern if image is missing */}
            <div style={{ display: 'none', height: '46px', alignItems: 'center', padding: '0 10px', backgroundColor: '#FFF', border: '1px dashed #CCC', fontSize: '12px' }}>
              LOGO 2 (Save as mohfw-logo.jpg in client/public)
            </div>
          </div>

          <div className="gov-title-block">
            <h1>AarogyaRakshak 2.0</h1>
            <p>U-WIN Rural Health Interoperability &amp; Digital Health Ecosystem</p>
          </div>
        </div>

        {/* Navigation Toolbar */}
        <nav className="gov-nav">
          <Link to="/" className="gov-nav-link">
            Home
          </Link>
          <Link to="/about" className="gov-nav-link">
            About Portal
          </Link>
          <Link to="/support" className="gov-nav-link">
            Support &amp; Helplines
          </Link>
          <Link to="/faq" className="gov-nav-link">
            FAQ
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 'bold' }}>
                {user.name} ({user.role?.toUpperCase()})
              </span>
              <button
                onClick={onLogout}
                className="gov-btn gov-btn-danger"
                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="gov-btn gov-btn-teal"
              style={{ marginLeft: '12px', padding: '7px 18px', fontSize: '0.88rem' }}
            >
              Portal Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

