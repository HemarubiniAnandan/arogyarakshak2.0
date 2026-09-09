import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  return (
    <div className="gov-container">
      {/* Page Header */}
      <div className="gov-card" style={{ background: 'linear-gradient(135deg, #003366 0%, #001A33 100%)', color: '#FFF' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#D4AF37', marginBottom: '10px' }}>
          About AarogyaRakshak 2.0 Platform
        </h2>
        <p style={{ fontSize: '0.98rem', color: '#E0E8F0', maxWidth: '850px' }}>
          AarogyaRakshak 2.0 is a flagship rural healthcare interoperability &amp; continuity-of-care solution developed for the Public Health Department, Government of Maharashtra.
        </p>
      </div>

      {/* Core Objectives */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">System Mission &amp; Architectural Objectives</div>
        </div>
        <div className="gov-grid-2" style={{ gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '8px' }}>1. Offline-First &amp; ASHA Assistance</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-dark)', lineHeight: '1.6' }}>
              Rural citizens in remote locations are never assumed to possess smartphones, high digital literacy, or reliable internet. ASHA health workers carry an offline-first Progressive Web App (PWA) backed by browser IndexedDB storage. Records created offline automatically flush to the central server with last-write-wins conflict resolution when returning to connectivity zones.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '8px' }}>2. Seamless Integration with Existing Portals</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-dark)', lineHeight: '1.6' }}>
              AarogyaRakshak does not attempt to replace existing government infrastructure. Instead, it unifies digital health records across national platforms:
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--gov-text-muted)', marginTop: '6px' }}>
              <li><strong>U-WIN:</strong> Child immunisation registry and due-list synchronization</li>
              <li><strong>e-Aushadhi:</strong> Real-time drug stock availability and warehouse tracking</li>
              <li><strong>eSanjeevani:</strong> Primary health centre teleconsultation workflows</li>
              <li><strong>ABDM / ABHA:</strong> Longitudinal health record passport and FHIR profile linkage</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '8px' }}>3. Multi-Lingual Interactive IVR &amp; Voice Reminders</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-dark)', lineHeight: '1.6' }}>
              For citizens on basic feature phones, automated reminders deliver interactive voice phone calls in local languages (Marathi and Hindi). If a voice call goes unanswered or fails, the escalation ladder automatically queues a physical follow-up task for the assigned village ASHA worker.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '8px' }}>4. Intelligent Triage &amp; Reappointment Engine</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-dark)', lineHeight: '1.6' }}>
              A rule-based triage algorithm classifies patient symptoms into severity levels (Routine, Urgent, Emergency) and recommends doctor specialties. In cases of doctor unavailability or sudden PHC closures, the reappointment engine transparently ranks nearby alternative PHCs by specialty match and distance.
            </p>
          </div>
        </div>
      </div>

      {/* Stakeholder Beneficiaries */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Impact Across Healthcare Roles</div>
        </div>

        <table className="gov-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Primary Interface</th>
              <th>Key Operational Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Rural Citizens</strong></td>
              <td>SMS Tokens, Interactive Voice Calls, QR Care Passport</td>
              <td>Zero smartphone dependency; automated voice reminders; instant emergency SOS escalation.</td>
            </tr>
            <tr>
              <td><strong>ASHA Workers</strong></td>
              <td>Offline PWA Dashboard &amp; Patient Auto-Suggest Search</td>
              <td>Offline registration, maternal ANC tracking, child immunisations, follow-up progress board.</td>
            </tr>
            <tr>
              <td><strong>Medical Officers</strong></td>
              <td>Doctor OPD Queue &amp; E-Prescription Portal</td>
              <td>Structured patient medical histories, rapid OPD consult confirmation, automatic slot management.</td>
            </tr>
            <tr>
              <td><strong>Facility Staff</strong></td>
              <td>Pharmacy Stock &amp; Resource Availability Panel</td>
              <td>Desk arrival QR scanner, equipment &amp; bed counters, emergency status toggle.</td>
            </tr>
            <tr>
              <td><strong>District Officials</strong></td>
              <td>Referral Funnel Analytics Desk</td>
              <td>Real-time visibility into referral conversions, hospital readiness scores, and IVR feedback ratings.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Call to Action */}
      <div className="gov-card" style={{ backgroundColor: 'var(--gov-blue-bg)', textAlign: 'center', padding: '25px' }}>
        <h3 style={{ color: 'var(--gov-blue-primary)', marginBottom: '10px' }}>Experience the Platform</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--gov-text-muted)', marginBottom: '15px' }}>
          Explore the role-based portals or run real-time medicine availability queries on the home page.
        </p>
        <Link to="/login" className="gov-btn gov-btn-primary" style={{ padding: '10px 24px' }}>
          Access Portal Login
        </Link>
      </div>
    </div>
  );
}
