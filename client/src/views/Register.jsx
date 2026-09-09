import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const MAHARASHTRA_CITIES = [
  'Satara', 'Karad', 'Pune', 'Mumbai', 'Kolhapur', 'Sangli', 'Nashik', 'Nagpur', 'Solapur', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Thane', 'Amravati'
];

const STATES = [
  'Maharashtra', 'Goa', 'Gujarat', 'Karnataka', 'Madhya Pradesh', 'Telangana', 'Chhattisgarh'
];

export default function Register({ currentUser }) {
  const [activeRole, setActiveRole] = useState('patient');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Shared Account Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [facilityId, setFacilityId] = useState('');

  // Role-Specific Fields
  // Patient Fields
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [village, setVillage] = useState('Umbraj');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Satara');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('415110');
  const [chronicConditions, setChronicConditions] = useState('');
  const [allergies, setAllergies] = useState('');

  // Doctor Fields
  const [licenseNo, setLicenseNo] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [facilityDoctors, setFacilityDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // ASHA Worker Fields
  const [ashaGovId, setAshaGovId] = useState('');
  const [catchmentVillage, setCatchmentVillage] = useState('');

  // Facility Staff / Pharmacy Fields
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/facilities')
      .then(res => res.json())
      .then(data => setFacilities(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeRole === 'doctor' && facilityId) {
      fetch(`http://localhost:3001/api/auth/facilities/${facilityId}/doctors`)
        .then(res => res.json())
        .then(data => setFacilityDoctors(data))
        .catch(() => setFacilityDoctors([]));
    }
  }, [facilityId, activeRole]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role: activeRole,
        facility_id: facilityId || null,
        age,
        dob,
        village: activeRole === 'patient' ? village : catchmentVillage,
        address: `${address}, ${village}, ${city}, ${state} - ${pincode}`,
        blood_group: bloodGroup,
        chronic_conditions: chronicConditions,
        allergies,
        doctor_id: selectedDoctorId || null,
        license_no: licenseNo,
        specialty,
        asha_gov_id: ashaGovId,
        employee_id: employeeId,
      };

      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      setSuccess(`Account registered successfully as ${activeRole.toUpperCase()}! Redirecting to login...`);
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-container" style={{ maxWidth: '850px' }}>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Role-Isolated Official Registration Portal</div>
          <span className="gov-badge gov-badge-aging">NHA / U-WIN Compliant</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginBottom: '18px' }}>
          Please select your official role category below. Each registration pathway enforces role-isolated credential validation to prevent security misuse.
        </p>

        {/* Role Category Isolation Tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid var(--uwin-border)', marginBottom: '22px', overflowX: 'auto' }}>
          {[
            { id: 'patient', label: 'Patient Registration' },
            { id: 'asha', label: 'ASHA Worker Registration' },
            { id: 'doctor', label: 'Medical Officer / Doctor' },
            { id: 'facility_staff', label: 'Facility / Hospital Staff' },
            { id: 'pharmacy', label: 'Retail / PHC Pharmacy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveRole(tab.id);
                setError('');
                setSuccess('');
              }}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeRole === tab.id ? '3px solid var(--uwin-navy)' : '3px solid transparent',
                backgroundColor: activeRole === tab.id ? '#F1F5F9' : 'transparent',
                color: activeRole === tab.id ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
                fontWeight: activeRole === tab.id ? '800' : '500',
                cursor: 'pointer',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                borderRadius: '6px 6px 0 0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--uwin-danger-bg)', color: 'var(--uwin-danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.88rem', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--uwin-emerald-bg)', color: 'var(--uwin-emerald)', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.88rem', fontWeight: 'bold' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit}>
          {/* Section Header */}
          <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '15px' }}>
            {activeRole === 'patient' && 'Patient Identity & Health Record Entry'}
            {activeRole === 'asha' && 'Government ASHA Health Worker Credentials'}
            {activeRole === 'doctor' && 'Medical Council Practitioner License Details'}
            {activeRole === 'facility_staff' && 'Hospital Administrative Staff Credentials'}
            {activeRole === 'pharmacy' && 'Pharmacy Unit License & Location'}
          </h4>

          {/* Common Account Credentials */}
          <div className="gov-grid-2">
            <div className="gov-form-group">
              <label className="gov-label">Full Legal Name *</label>
              <input
                type="text"
                className="gov-input"
                required
                placeholder="e.g. Ramesh Mahadev Jadhav"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="gov-form-group">
              <label className="gov-label">Mobile Number (10 Digits) *</label>
              <input
                type="tel"
                className="gov-input"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="gov-grid-2">
            <div className="gov-form-group">
              <label className="gov-label">Email Address *</label>
              <input
                type="email"
                className="gov-input"
                required
                placeholder="e.g. ramesh@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Facility Selector for Doctor, ASHA, Staff, Pharmacy */}
            {activeRole !== 'patient' && (
              <div className="gov-form-group">
                <label className="gov-label">Assigned Primary Health Centre / Hospital *</label>
                <select
                  className="gov-select"
                  required
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                >
                  <option value="">Select Government Health Facility...</option>
                  {facilities.map((f) => (
                    <option key={f.facility_id} value={f.facility_id}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ROLE-SPECIFIC CUSTOM FIELDS */}

          {/* 1. PATIENT SPECIFIC FIELDS */}
          {activeRole === 'patient' && (
            <>
              <div className="gov-grid-2">
                <div className="gov-form-group">
                  <label className="gov-label">Age *</label>
                  <input
                    type="number"
                    className="gov-input"
                    required
                    placeholder="e.g. 42"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Date of Birth</label>
                  <input
                    type="date"
                    className="gov-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              <div className="gov-grid-2">
                <div className="gov-form-group">
                  <label className="gov-label">Blood Group *</label>
                  <select className="gov-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Village / Gram Panchayat *</label>
                  <input
                    type="text"
                    className="gov-input"
                    required
                    placeholder="e.g. Umbraj / Masur"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </div>
              </div>

              <div className="gov-grid-2">
                <div className="gov-form-group">
                  <label className="gov-label">District / City *</label>
                  <select className="gov-select" value={city} onChange={(e) => setCity(e.target.value)}>
                    {MAHARASHTRA_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">State *</label>
                  <select className="gov-select" value={state} onChange={(e) => setState(e.target.value)}>
                    {STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">House Address &amp; Street</label>
                <input
                  type="text"
                  className="gov-input"
                  placeholder="e.g. House No. 12, Near Gram Panchayat Office"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="gov-grid-2">
                <div className="gov-form-group">
                  <label className="gov-label">Pre-existing Chronic Conditions (if any)</label>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="e.g. Diabetes, Hypertension, Asthma"
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Drug Allergies (if any)</label>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="e.g. Penicillin, Sulfa"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* 2. DOCTOR SPECIFIC FIELDS */}
          {activeRole === 'doctor' && (
            <div className="gov-grid-2">
              <div className="gov-form-group">
                <label className="gov-label">Claim Uploaded Roster Identity *</label>
                <select
                  className="gov-select"
                  required
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    const selected = facilityDoctors.find(d => d.doctor_id === e.target.value);
                    if (selected) {
                      setName(selected.name); // Auto-fill name
                      setSpecialty(selected.specialty || 'General Medicine');
                    }
                  }}
                >
                  <option value="">-- Select Your Name from Hospital Roster --</option>
                  {facilityDoctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                  <option value="new">Register as New/Independent Doctor</option>
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
                  If your hospital uploaded the duty roster, select your name from the dropdown to link your slots.
                </p>
              </div>

              {selectedDoctorId === 'new' && (
                <div className="gov-form-group">
                  <label className="gov-label">State Medical Council Registration No. *</label>
                  <input
                    type="text"
                    className="gov-input"
                    required
                    placeholder="e.g. MMC-2018-09-4821"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. ASHA WORKER SPECIFIC FIELDS */}
          {activeRole === 'asha' && (
            <div className="gov-grid-2">
              <div className="gov-form-group">
                <label className="gov-label">ASHA Government Identity Number *</label>
                <input
                  type="text"
                  className="gov-input"
                  required
                  placeholder="e.g. ASHA-MH-STR-042"
                  value={ashaGovId}
                  onChange={(e) => setAshaGovId(e.target.value)}
                />
              </div>

              <div className="gov-form-group">
                <label className="gov-label">Assigned Catchment Village / Beat *</label>
                <input
                  type="text"
                  className="gov-input"
                  required
                  placeholder="e.g. Masur Village Beat #3"
                  value={catchmentVillage}
                  onChange={(e) => setCatchmentVillage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 4. FACILITY STAFF / PHARMACY SPECIFIC FIELDS */}
          {(activeRole === 'facility_staff' || activeRole === 'pharmacy') && (
            <div className="gov-form-group">
              <label className="gov-label">Employee Staff ID Number *</label>
              <input
                type="text"
                className="gov-input"
                required
                placeholder="e.g. EMP-PHC-8891"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          )}

          {/* Passwords */}
          <div className="gov-grid-2">
            <div className="gov-form-group">
              <label className="gov-label">Password *</label>
              <input
                type="password"
                className="gov-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="gov-form-group">
              <label className="gov-label">Confirm Password *</label>
              <input
                type="password"
                className="gov-input"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <Link to="/login" className="gov-btn gov-btn-secondary">
              Back to Portal Login
            </Link>
            <button type="submit" className="gov-btn gov-btn-teal" disabled={loading}>
              {loading ? 'Registering...' : `Submit ${activeRole.toUpperCase()} Registration`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
