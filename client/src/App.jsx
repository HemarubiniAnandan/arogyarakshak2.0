import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Views
import Homepage from './views/Homepage';
import AboutUs from './views/AboutUs';
import Support from './views/Support';
import FaqPage from './views/FaqPage';
import Login from './views/Login';
import Register from './views/Register';
import PatientDashboard from './views/PatientDashboard';
import AppointmentBooking from './views/AppointmentBooking';
import VaccinationBooking from './views/VaccinationBooking';
import SosPage from './views/SosPage';
import AshaDashboard from './views/AshaDashboard';
import DoctorDashboard from './views/DoctorDashboard';
import FacilityDashboard from './views/FacilityDashboard';
import PharmacyDashboard from './views/PharmacyDashboard';
import DistrictDashboard from './views/DistrictDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aarogya_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (authData) => {
    const userData = {
      ...authData.user,
      token: authData.token,
    };
    setUser(userData);
    localStorage.setItem('aarogya_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aarogya_user');
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header user={user} onLogout={handleLogout} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/support" element={<Support />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register currentUser={user} />} />
            <Route path="/sos" element={<SosPage />} />

            {/* Protected Role Routes */}
            <Route
              path="/patient"
              element={user ? <PatientDashboard user={user} /> : <Navigate to="/login?role=patient" />}
            />
            <Route
              path="/patient/book"
              element={user ? <AppointmentBooking user={user} /> : <Navigate to="/login?role=patient" />}
            />
            <Route
              path="/patient/vaccination"
              element={user ? <VaccinationBooking user={user} /> : <Navigate to="/login?role=patient" />}
            />

            <Route
              path="/asha"
              element={user && (user.role === 'asha' || user.role === 'doctor') ? <AshaDashboard user={user} /> : <Navigate to="/login?role=asha" />}
            />

            <Route
              path="/doctor"
              element={user && user.role === 'doctor' ? <DoctorDashboard user={user} /> : <Navigate to="/login?role=doctor" />}
            />

            <Route
              path="/facility"
              element={user && (user.role === 'facility_staff' || user.role === 'doctor') ? <FacilityDashboard user={user} /> : <Navigate to="/login?role=facility_staff" />}
            />

            <Route
              path="/pharmacy"
              element={user && (user.role === 'pharmacy' || user.role === 'facility_staff') ? <PharmacyDashboard user={user} /> : <Navigate to="/login?role=pharmacy" />}
            />

            <Route
              path="/district"
              element={user && (user.role === 'district_official' || user.role === 'facility_staff') ? <DistrictDashboard user={user} /> : <Navigate to="/login?role=district_official" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
