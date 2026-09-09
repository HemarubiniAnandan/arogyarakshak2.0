import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import SimulatedBadge from '../components/SimulatedBadge';
import QrScannerModal from '../components/QrScannerModal';
import AppointmentTrackerStepper from '../components/AppointmentTrackerStepper';

export default function FacilityDashboard({ user }) {
  const [facility, setFacility] = useState({
    facility_id: user.facility_id || 'FAC-DEMO-001',
    name: 'Primary Health Centre Karad (PHC Karad)',
    type: 'Primary Health Centre',
    emergency_accepted: 1,
    bed_count: 20,
    staff_count: 12,
  });

  const [appointments, setAppointments] = useState([]);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [emergencyStatus, setEmergencyStatus] = useState(1);
  const [activeTab, setActiveTab] = useState('resources');
  const [showQrModal, setShowQrModal] = useState(false);
  const [uploadedDoctors, setUploadedDoctors] = useState([]);

  // Dynamic Facility Resources State with Row Control
  const [resources, setResources] = useState([
    { id: 1, name: 'General Ward Beds', qty: 20, status: 'Available', type: 'Bed' },
    { id: 2, name: 'ICU Beds with Ventilator Support', qty: 4, status: 'Available', type: 'Bed' },
    { id: 3, name: 'Oxygen Cylinders (D-Type)', qty: 18, status: 'Available', type: 'Equipment' },
    { id: 4, name: 'Emergency Stretchers', qty: 8, status: 'Available', type: 'Equipment' },
    { id: 5, name: 'Wheelchairs', qty: 12, status: 'Available', type: 'Equipment' },
    { id: 6, name: 'On-Duty Staff Nurses', qty: 12, status: 'Available', type: 'Staff' },
  ]);

  // Dynamic Vaccination Stock State with Row Control
  const [vaccines, setVaccines] = useState([
    { id: 1, name: 'BCG (Tuberculosis)', doses: 150, status: 'In Stock', target: 'Infants at birth' },
    { id: 2, name: 'OPV (Oral Polio Vaccine)', doses: 300, status: 'In Stock', target: 'Birth, 6, 10, 14 weeks' },
    { id: 3, name: 'Pentavalent (DPT+HepB+Hib)', doses: 120, status: 'In Stock', target: '6, 10, 14 weeks' },
    { id: 4, name: 'Rotavirus Vaccine', doses: 85, status: 'In Stock', target: '6, 10, 14 weeks' },
    { id: 5, name: 'Measles-Rubella (MR) 1st Dose', doses: 95, status: 'In Stock', target: '9-12 months' },
    { id: 6, name: 'DPT Booster 1st Dose', doses: 60, status: 'In Stock', target: '16-24 months' },
  ]);

  useEffect(() => {
    fetchAppointments();
    fetchRegisteredPatients();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const aptRes = await fetch(`http://localhost:3001/api/appointments`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const aptData = await aptRes.json();
      setAppointments(aptData);
    } catch (err) {
      console.error('Load facility appointments error:', err);
    }
  };

  const fetchRegisteredPatients = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/patients`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await res.json();
      setRegisteredPatients(data);
    } catch (err) {
      console.error('Fetch registered patients error:', err);
    }
  };

  const handleToggleEmergency = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/facilities/${facility.facility_id}/toggle-emergency`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await res.json();
      setEmergencyStatus(data.emergency_accepted);
      alert(`Emergency status updated: ${data.message}`);
    } catch (err) {
      setEmergencyStatus(prev => prev === 1 ? 0 : 1);
    }
  };

  const handleQrVerified = async (tokenId) => {
    setShowQrModal(false);
    let aptId = tokenId.trim();

    try {
      await fetch(`http://localhost:3001/api/appointments/${aptId}/arrive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      alert(`Patient Reception Desk Arrival Verified!\nToken/ID: ${aptId}\nStatus updated to 'IN PROGRESS'.`);
      fetchAppointments();
    } catch (err) {
      alert('Error processing desk arrival QR verification.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('Excel file is empty or formatted incorrectly.');
          return;
        }

        const payload = data.map(r => {
          let dateStr = r.Date;
          if (typeof dateStr === 'number') {
            const dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            dateStr = dateObj.toISOString().split('T')[0];
          }
          return { ...r, Date: dateStr };
        }).filter(r => r.Doctor_ID && r.Date && r.Slot_Time);

        const response = await fetch('http://localhost:3001/api/appointments/roster-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ data: payload }) // Send parsed rows
        });

        if (!response.ok) {
          throw new Error('Server error during upload');
        }

        setUploadedDoctors(payload);
        alert(`Successfully synchronized ${payload.length} roster slot rows into the U-WIN database!`);
      } catch (err) {
        console.error('File parsing/upload error:', err);
        alert('Failed to process doctor roster. Make sure the backend is running and the format is correct.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Dynamic Row Controls for Resource Table
  const handleAddResourceRow = () => {
    const name = prompt('Enter new Resource / Equipment / Bed Name:');
    if (!name) return;
    const type = prompt('Enter Category (Bed / Equipment / Staff):', 'Equipment') || 'Equipment';
    const qty = parseInt(prompt('Enter Available Quantity:', '10')) || 10;
    setResources([
      ...resources,
      { id: Date.now(), name, type, qty, status: 'Available' }
    ]);
  };

  const handleDeleteResourceRow = (id) => {
    if (resources.length <= 1) return;
    setResources(resources.filter(r => r.id !== id));
  };

  const updateResourceQty = async (id, delta) => {
    const updated = resources.map(r => r.id === id ? { ...r, qty: Math.max(0, r.qty + delta) } : r);
    setResources(updated);
  };

  const toggleResourceStatus = (id) => {
    setResources(resources.map(r => r.id === id ? { ...r, status: r.status === 'Available' ? 'Unavailable' : 'Available' } : r));
  };

  // Dynamic Row Controls for Vaccine Table
  const handleAddVaccineRow = () => {
    const name = prompt('Enter new Vaccine Name (e.g. Hepatitis B Booster):');
    if (!name) return;
    const target = prompt('Enter Target Group (e.g. Children 5-6 yrs):', 'General') || 'General';
    const doses = parseInt(prompt('Enter Initial Vial Doses:', '100')) || 100;
    setVaccines([
      ...vaccines,
      { id: Date.now(), name, target, doses, status: 'In Stock' }
    ]);
  };

  const handleDeleteVaccineRow = (id) => {
    if (vaccines.length <= 1) return;
    setVaccines(vaccines.filter(v => v.id !== id));
  };

  const updateVaccineDoses = (id, delta) => {
    setVaccines(vaccines.map(v => v.id === id ? { ...v, doses: Math.max(0, v.doses + delta) } : v));
  };

  const toggleVaccineStatus = (id) => {
    setVaccines(vaccines.map(v => v.id === id ? { ...v, status: v.status === 'In Stock' ? 'Out of Stock' : 'In Stock' } : v));
  };

  const bookedCount = appointments.filter(a => a.status === 'booked' && !a.arrived_at).length;
  const arrivedCount = appointments.filter(a => a.arrived_at && a.status !== 'completed').length;
  const seenCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="gov-container">
      {/* Facility Header Card */}
      <div className="gov-card" style={{ borderLeft: '6px solid var(--uwin-navy)', backgroundColor: 'var(--uwin-teal-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: 'var(--uwin-navy)' }}>Facility Operations &amp; Dynamic Resource Desk</h2>
            <p style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--uwin-navy)', marginTop: '4px' }}>
              Assigned Facility: {facility.name} ({facility.type})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setShowQrModal(true)} className="gov-btn gov-btn-teal">
              Open Reception Desk QR Camera
            </button>
            <button
              onClick={handleToggleEmergency}
              className={`gov-btn ${emergencyStatus ? 'gov-btn-success' : 'gov-btn-danger'}`}
            >
              {emergencyStatus ? 'ACCEPTING EMERGENCIES (ON)' : 'EMERGENCIES PAUSED (OFF)'}
            </button>
          </div>
        </div>
      </div>

      {/* Counters Bar */}
      <div className="gov-grid" style={{ marginBottom: '22px' }}>
        <div className="gov-stat-box" style={{ borderLeftColor: 'var(--uwin-navy)' }}>
          <div className="gov-stat-number" style={{ color: 'var(--uwin-navy)' }}>{bookedCount}</div>
          <div className="gov-stat-label">Booked Appointments (Awaiting)</div>
        </div>
        <div className="gov-stat-box" style={{ borderLeftColor: 'var(--uwin-teal)' }}>
          <div className="gov-stat-number" style={{ color: 'var(--uwin-teal)' }}>{arrivedCount}</div>
          <div className="gov-stat-label">Arrived at Reception Desk</div>
        </div>
        <div className="gov-stat-box" style={{ borderLeftColor: 'var(--uwin-emerald)' }}>
          <div className="gov-stat-number" style={{ color: 'var(--uwin-emerald)' }}>{seenCount}</div>
          <div className="gov-stat-label">Consultations Completed</div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="gov-card">
        <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid var(--uwin-border)', marginBottom: '22px', overflowX: 'auto' }}>
          {[
            { id: 'resources', label: 'Beds & Resources (Dynamic Roster)' },
            { id: 'vaccines', label: 'Vaccination Stock (U-WIN Portal)' },
            { id: 'patients', label: 'Portal Registered Patients' },
            { id: 'daily_tracker', label: 'Daily Assigned Patients & Progress' },
            { id: 'excel', label: 'Doctor Schedule Excel Upload' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === t.id ? '3px solid var(--uwin-navy)' : '3px solid transparent',
                backgroundColor: activeTab === t.id ? '#F1F5F9' : 'transparent',
                color: activeTab === t.id ? 'var(--uwin-navy)' : 'var(--uwin-text-dark)',
                fontWeight: activeTab === t.id ? '800' : '600',
                cursor: 'pointer',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Dynamic Equipment & Bed Resource Management */}
        {activeTab === 'resources' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ color: 'var(--uwin-navy)', margin: 0 }}>
                  Facility Equipment, Beds &amp; Personnel Readiness Desk
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '2px' }}>
                  Manage availability items with dynamic row controls and live quantity counters.
                </p>
              </div>
              <button onClick={handleAddResourceRow} className="gov-btn gov-btn-teal">
                + Add Dynamic Resource Row
              </button>
            </div>

            <table className="gov-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item Name</th>
                  <th>Quantity Available</th>
                  <th>Live Quantity Controls</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => (
                  <tr key={r.id}>
                    <td><span className="gov-badge gov-badge-aging">{r.type}</span></td>
                    <td><strong>{r.name}</strong></td>
                    <td><strong style={{ fontSize: '1.1rem', color: r.qty > 0 ? 'var(--uwin-emerald)' : 'var(--uwin-danger)' }}>{r.qty}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => updateResourceQty(r.id, -1)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 10px', fontSize: '0.85rem' }}
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateResourceQty(r.id, 1)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 10px', fontSize: '0.85rem' }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`gov-badge ${r.status === 'Available' ? 'gov-badge-fresh' : 'gov-badge-stale'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => toggleResourceStatus(r.id)}
                          className={`gov-btn ${r.status === 'Available' ? 'gov-btn-danger' : 'gov-btn-success'}`}
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDeleteResourceRow(r.id)}
                          className="gov-btn gov-btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Dynamic Vaccination Stock Panel */}
        {activeTab === 'vaccines' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ color: 'var(--uwin-navy)', margin: 0 }}>
                  U-WIN Child &amp; Maternal Vaccination Stock Roster
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <SimulatedBadge adapterName="U-WIN adapter" />
                <button onClick={handleAddVaccineRow} className="gov-btn gov-btn-teal">
                  + Add Dynamic Vaccine Row
                </button>
              </div>
            </div>

            <table className="gov-table">
              <thead>
                <tr>
                  <th>Vaccine Name</th>
                  <th>Target Group</th>
                  <th>Vial Doses Available</th>
                  <th>Dose Adjustments</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.name}</strong></td>
                    <td>{v.target}</td>
                    <td><strong style={{ fontSize: '1.1rem', color: v.doses > 0 ? 'var(--uwin-emerald)' : 'var(--uwin-danger)' }}>{v.doses} doses</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => updateVaccineDoses(v.id, -10)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.82rem' }}
                        >
                          -10
                        </button>
                        <button
                          onClick={() => updateVaccineDoses(v.id, 10)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.82rem' }}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`gov-badge ${v.status === 'In Stock' ? 'gov-badge-fresh' : 'gov-badge-stale'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => toggleVaccineStatus(v.id)}
                          className={`gov-btn ${v.status === 'In Stock' ? 'gov-btn-danger' : 'gov-btn-success'}`}
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDeleteVaccineRow(v.id)}
                          className="gov-btn gov-btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Portal Registered Patients */}
        {activeTab === 'patients' && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '14px' }}>
              Portal Registered Patients Directory ({registeredPatients.length} Records)
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginBottom: '16px' }}>
              Live patient database registered across self-service portal and ASHA-assisted registration desks.
            </p>

            {registeredPatients.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)', padding: '20px 0' }}>No registered patient records found.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>ABHA ID</th>
                    <th>Full Name</th>
                    <th>Phone</th>
                    <th>Village</th>
                    <th>Blood Group</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredPatients.map((p) => (
                    <tr key={p.patient_id}>
                      <td><strong>{p.patient_id}</strong></td>
                      <td><span className="gov-badge gov-badge-aging">{p.abha_id}</span></td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.phone || 'N/A'}</td>
                      <td>{p.village || 'Satara'}</td>
                      <td><strong style={{ color: 'var(--uwin-teal)' }}>{p.blood_group || 'O+'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 4: Daily Appointment Tracker / assigned today */}
        {activeTab === 'daily_tracker' && (
          <div>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '14px' }}>
              Daily Assigned Patients &amp; Appointment Progress Tracker
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginBottom: '16px' }}>
              Live tracker for all consultations assigned to this facility today.
            </p>

            {appointments.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)', padding: '20px 0' }}>No appointments tracked for today.</p>
            ) : (
              appointments.map(apt => (
                <div key={apt.appointment_id} style={{ border: '1px solid var(--uwin-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong>Token #{apt.token_number || 1}</strong> — Patient: <strong>{apt.patient_name || 'Sunanda Kamble'}</strong> ({apt.patient_phone})<br/>
                      <span style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)' }}>Assigned Doctor: {apt.doctor_name || 'Medical Officer'} | Scheduled: {apt.date} {apt.time}</span>
                    </div>
                  </div>
                  <AppointmentTrackerStepper appointment={apt} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Excel Roster Upload */}
        {activeTab === 'excel' && (
          <div style={{ maxWidth: '650px' }}>
            <h4 style={{ color: 'var(--uwin-navy)', marginBottom: '10px' }}>
              Doctor Availability Roster Excel Upload
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--uwin-text-muted)', marginBottom: '15px' }}>
              Upload weekly duty schedule (.xlsx or .csv) to bulk update doctor dates and OPD slots.
            </p>

            <div style={{ border: '2px dashed var(--uwin-border)', padding: '35px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#F8FAFC' }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="excelUploadInput"
              />
              <label htmlFor="excelUploadInput" className="gov-btn gov-btn-teal" style={{ cursor: 'pointer', padding: '12px 24px' }}>
                Choose Excel / CSV File
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--uwin-text-muted)', marginTop: '12px' }}>
                Required Headers: Doctor_ID, Doctor_Name, Specialty, Date, Slot_Time, Status
              </p>
            </div>

            {uploadedDoctors.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h5 style={{ color: 'var(--uwin-navy)', marginBottom: '10px' }}>
                  Successfully Uploaded & Synchronized Doctors ({[...new Set(uploadedDoctors.map(d => d.Doctor_ID))].length})
                </h5>
                <table className="gov-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Doctor ID</th>
                      <th>Name</th>
                      <th>Specialty</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedDoctors.map((doc, idx) => (
                      <tr key={idx}>
                        <td><strong>{doc.Doctor_ID}</strong></td>
                        <td>{doc.Doctor_Name || 'Unknown'}</td>
                        <td>{doc.Specialty || 'General'}</td>
                        <td>{doc.Date}</td>
                        <td><strong>{doc.Slot_Time}</strong></td>
                        <td>
                          <span className={`gov-badge ${doc.Status?.toLowerCase() === 'unavailable' ? 'gov-badge-danger' : 'gov-badge-success'}`}>
                            {doc.Status || 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQrModal && (
        <QrScannerModal
          title="Facility Reception Desk QR Scanner"
          subtitle="Scan patient appointment QR code to confirm desk arrival"
          onScanSuccess={handleQrVerified}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
