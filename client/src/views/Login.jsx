import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';


export default function Login({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'asha';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data);

      if (data.user.role === 'asha') navigate('/asha');
      else if (data.user.role === 'doctor') navigate('/doctor');
      else if (data.user.role === 'facility_staff') navigate('/facility');
      else if (data.user.role === 'pharmacy') navigate('/pharmacy');
      else if (data.user.role === 'district_official') navigate('/district');
      else navigate('/patient');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (targetRole) => {
    setRole(targetRole);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="gov-container" style={{ maxWidth: '750px' }}>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Government Portal Authentication</div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-muted)', marginBottom: '20px' }}>
          Select your authorized government role below to log into the AarogyaRakshak system.
        </p>

        {/* 6 Selectable Role Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '25px' }}>
          {[
            { id: 'patient', label: 'Patient' },
            { id: 'asha', label: 'ASHA Worker' },
            { id: 'doctor', label: 'Doctor' },
            { id: 'facility_staff', label: 'Facility Staff' },
            { id: 'pharmacy', label: 'Pharmacy' },
            { id: 'district_official', label: 'Government Dept' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleSelect(r.id)}
              style={{
                padding: '14px 8px',
                borderRadius: '4px',
                border: role === r.id ? '2px solid var(--gov-blue-primary)' : '1px solid var(--gov-border)',
                backgroundColor: role === r.id ? 'var(--gov-blue-bg)' : '#FFFFFF',
                color: role === r.id ? 'var(--gov-blue-dark)' : 'var(--gov-text-dark)',
                fontWeight: role === r.id ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '0.88rem',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--gov-danger-bg)', color: 'var(--gov-danger)', padding: '10px 12px', borderRadius: '3px', marginBottom: '15px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="gov-form-group">
            <label className="gov-label">Email / User ID</label>
            <input
              type="email"
              className="gov-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="gov-form-group">
            <label className="gov-label">Password</label>
            <input
              type="password"
              className="gov-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {role === 'district_official' && (
            <p style={{ fontSize: '0.8rem', color: '#856404', backgroundColor: '#FFF3CD', padding: '6px 10px', borderRadius: '3px', marginBottom: '15px' }}>
              Government Department accounts are read-only (monitoring &amp; funnel analytics access).
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <Link to="/register" style={{ fontSize: '0.85rem' }}>
              Need a new account? Register here
            </Link>
            <button type="submit" className="gov-btn gov-btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : `Log In as ${role.toUpperCase().replace('_', ' ')}`}
            </button>
          </div>
        </form>

        </div>
    </div>
  );
}
