import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SimulatedBadge from '../components/SimulatedBadge';

export default function Homepage() {
  const [medicineQuery, setMedicineQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [parsingPrescription, setParsingPrescription] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [lang, setLang] = useState('en');
  const navigate = useNavigate();

  useEffect(() => {
    const handleLang = (e) => setLang(e.detail);
    window.addEventListener('languageChange', handleLang);
    return () => window.removeEventListener('languageChange', handleLang);
  }, []);

  const handleSearchMedicine = async (queryToSearch) => {
    const q = (queryToSearch || medicineQuery).trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/stock/search/${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Medicine search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPrescriptionFile(file);
    setParsingPrescription(true);

    setTimeout(() => {
      setParsingPrescription(false);
      const parsedMed = 'Paracetamol';
      setMedicineQuery(parsedMed);
      handleSearchMedicine(parsedMed);
    }, 1200);
  };

  const texts = {
    en: {
      heroTitle: 'Rural Healthcare Interoperability & Continuity of Care',
      heroSubtitle: 'Empowering ASHA health workers, PHC doctors, retail pharmacies, and rural citizens with offline-first digital triage, smart scheduling, longitudinal care records, and automated reminders.',
      loginBtn: 'Portal Login / Access Desk',
      registerBtn: 'New Registration',
      bookBtn: 'Book Doctor Appointment',
      medSearchTitle: 'Real-Time Pharmacy Stock & Prescription Search',
      medSearchDesc: 'Search drug availability across Primary Health Centres and retail pharmacies in Maharashtra or upload a doctor prescription file to auto-parse available stock.',
    },
    hi: {
      heroTitle: 'ग्रामीण स्वास्थ्य सेवा सुलभता और निरंतर देखभाल',
      heroSubtitle: 'आशा कार्यकर्ताओं, डॉक्टरों, फार्मास्यूटिकल्स और नागरिकों को डिजिटल ट्राइएज, अपॉइंटमेंट और मेडिसिन स्टॉक की सुविधा प्रदान करना।',
      loginBtn: 'पोर्टल लॉगिन / प्रवेश',
      registerBtn: 'नया पंजीकरण',
      bookBtn: 'अपॉइंटमेंट बुक करें',
      medSearchTitle: 'रियल-टाइम दवा स्टॉक और पर्ची खोज',
      medSearchDesc: 'महाराष्ट्र के प्राथमिक स्वास्थ्य केंद्रों और फार्मेसियों में दवा की उपलब्धता खोजें या पर्ची अपलोड करें।',
    },
    mr: {
      heroTitle: 'ग्रामीण आरोग्य सेवा आणि सातत्यपूर्ण काळजी',
      heroSubtitle: 'आशा सेविका, वैद्यकीय अधिकारी, औषध विक्रेते आणि ग्रामीण नागरिकांना डिजिटल ट्रायज आणि औषध उपलब्धतेची सुविधा.',
      loginBtn: 'पोर्टल लॉगिन / प्रवेश',
      registerBtn: 'नवीन नोंदणी',
      bookBtn: 'अपॉइंटमेंट नोंदवा',
      medSearchTitle: 'वास्तविक वेळेत औषध साठा आणि प्रिस्क्रिप्शन शोध',
      medSearchDesc: 'प्राथमिक आरोग्य केंद्र आणि फार्मसी मधील औषध साठा शोधा किंवा प्रिस्क्रिप्शन अपलोड करा.',
    },
  };

  const t = texts[lang] || texts.en;

  const faqs = [
    {
      id: 1,
      question: 'What is AarogyaRakshak 2.0?',
      answer: 'AarogyaRakshak 2.0 is an offline-first, ASHA-worker-assisted rural healthcare interoperability platform developed for Public Health Department, Government of Maharashtra. It bridges existing digital health portals (U-WIN, e-Aushadhi, eSanjeevani, ABDM) without replacing them.',
    },
    {
      id: 2,
      question: 'How do rural citizens without smartphones or internet access use the platform?',
      answer: 'Rural citizens are assisted directly by village ASHA health workers who operate the offline PWA. Additionally, patients receive automated interactive IVR voice calls and SMS tokens in local languages (Marathi/Hindi) on basic feature phones.',
    },
    {
      id: 3,
      question: 'What happens when there is no cellular or internet connectivity in remote villages?',
      answer: 'The application operates 100% offline using IndexedDB storage. ASHA workers can register patients, log ANC visits, and run triage evaluation offline. All queued actions flush automatically to the central server when connectivity is restored, backed by last-write-wins conflict auditing.',
    },
    {
      id: 4,
      question: 'How are emergency medical situations handled?',
      answer: 'The Emergency SOS Escalation tool uses GPS location to identify nearby facilities currently accepting emergency cases. It dispatches a digital escalation ticket to the District Health Command Center and notifies local PHC emergency teams.',
    },
    {
      id: 5,
      question: 'What occurs when a Primary Health Centre doctor is unavailable?',
      answer: 'When a Medical Officer marks themselves unavailable, scheduled appointments are auto-cancelled and patients receive immediate automated IVR voice notifications. The Reappointment Engine evaluates alternative nearby slots ranked by specialty match, facility readiness score, and distance.',
    },
    {
      id: 6,
      question: 'How does AarogyaRakshak integrate with government systems like ABDM, U-WIN, and e-Aushadhi?',
      answer: 'AarogyaRakshak utilizes standardized mock API adapters matching official government schemas. It retrieves child immunisation due-lists from U-WIN, queries live pharmacy stock from e-Aushadhi, fetches teleconsultation slots from eSanjeevani, and generates FHIR-shaped longitudinal care passports linked with ABHA IDs.',
    },
  ];

  return (
    <div className="gov-container" style={{ position: 'relative' }}>
      {/* Floating Circular SOS Button (Right Side Below Profile/Header) */}
      <Link to="/sos" className="uwin-floating-sos" title="Trigger Emergency SOS Dispatch">
        <div className="uwin-sos-circle">
          <span>SOS</span>
        </div>
        <span className="uwin-sos-label">Emergency</span>
      </Link>

      {/* Hero Section — U-WIN Government Theme Banner */}
      <div className="gov-card" style={{ background: 'linear-gradient(135deg, var(--uwin-navy-dark) 0%, var(--uwin-navy) 100%)', color: '#FFFFFF', padding: '36px 30px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '2.1rem', color: '#FFFFFF', marginBottom: '14px', fontWeight: '800' }}>
          {t.heroTitle}
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#CBD5E1', maxWidth: '880px', lineHeight: '1.6', marginBottom: '22px' }}>
          {t.heroSubtitle}
        </p>

        {/* Hero Action Buttons Bar */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link to="/login" className="gov-btn gov-btn-teal" style={{ padding: '11px 24px', fontSize: '0.95rem' }}>
            {t.loginBtn}
          </Link>
          <Link to="/register" className="gov-btn gov-btn-primary" style={{ padding: '11px 24px', fontSize: '0.95rem', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
            {t.registerBtn}
          </Link>
          <Link to="/patient/book" className="gov-btn gov-btn-secondary" style={{ padding: '11px 24px', fontSize: '0.95rem' }}>
            {t.bookBtn}
          </Link>
        </div>
      </div>

      {/* Real-Time Medicine Search & Prescription Upload */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">{t.medSearchTitle}</div>
          <SimulatedBadge adapterName="e-Aushadhi adapter" />
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--uwin-text-muted)', marginBottom: '18px' }}>
          {t.medSearchDesc}
        </p>

        <div className="gov-grid-2" style={{ gap: '24px', marginBottom: '20px' }}>
          {/* Manual Query Form */}
          <div>
            <label className="gov-label">Search Medicine Name</label>
            <form onSubmit={(e) => { e.preventDefault(); handleSearchMedicine(); }} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="gov-input"
                placeholder="Enter medicine (e.g. Paracetamol, Amoxicillin)..."
                value={medicineQuery}
                onChange={(e) => setMedicineQuery(e.target.value)}
              />
              <button type="submit" className="gov-btn gov-btn-teal" disabled={loading}>
                {loading ? 'Searching...' : 'Search Stock'}
              </button>
            </form>
          </div>

          {/* Upload Prescription */}
          <div style={{ borderLeft: '2px solid var(--uwin-border)', paddingLeft: '20px' }}>
            <label className="gov-label">Upload Doctor Prescription (Image / PDF)</label>
            <input
              type="file"
              className="gov-input"
              accept="image/*,.pdf"
              onChange={handlePrescriptionUpload}
            />
            {parsingPrescription && (
              <p style={{ fontSize: '0.82rem', color: 'var(--uwin-teal)', marginTop: '6px', fontWeight: 'bold' }}>
                Parsing prescription contents &amp; querying pharmacy inventory...
              </p>
            )}
            {prescriptionFile && !parsingPrescription && (
              <p style={{ fontSize: '0.82rem', color: 'var(--uwin-emerald)', marginTop: '6px', fontWeight: 'bold' }}>
                Prescription uploaded: {prescriptionFile.name} (Auto-parsed: Paracetamol)
              </p>
            )}
          </div>
        </div>

        {searchResults && (
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--uwin-navy)' }}>
              Stock Search Results for "{searchResults.query}" ({searchResults.local_stock.length} facilities found)
            </h4>

            {searchResults.local_stock.length === 0 ? (
              <p style={{ color: 'var(--uwin-text-muted)', fontSize: '0.9rem' }}>No local stock found matching query.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Facility / Pharmacy Name</th>
                    <th>Medicine</th>
                    <th>Available Quantity</th>
                    <th>Status</th>
                    <th>Freshness Label</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.local_stock.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.facility_name}</strong></td>
                      <td>{item.medicine_name}</td>
                      <td><strong style={{ fontSize: '1.05rem', color: 'var(--uwin-emerald)' }}>{item.quantity} units</strong></td>
                      <td>
                        <span className={`gov-badge ${item.quantity_status === 'available' ? 'gov-badge-fresh' : 'gov-badge-stale'}`}>
                          {item.quantity_status}
                        </span>
                      </td>
                      <td>
                        <span className={`gov-badge gov-badge-${item.freshness}`}>
                          {item.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 6 Role Portals Grid */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Role-Based Portals &amp; Entry Points</div>
        </div>

        <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: 'var(--uwin-navy)' }} onClick={() => navigate('/login?role=patient')}>
            <h4 style={{ color: 'var(--uwin-navy)' }}>Patient Portal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              View Care Passport, upcoming appointments, vaccination tracker, and chronic health readings.
            </p>
          </div>

          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: 'var(--uwin-teal)' }} onClick={() => navigate('/login?role=asha')}>
            <h4 style={{ color: 'var(--uwin-teal)' }}>ASHA Worker Portal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              Assisted triage, patient search roster, priority queue follow-ups, and booking on behalf of citizens.
            </p>
          </div>

          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: 'var(--uwin-emerald)' }} onClick={() => navigate('/login?role=doctor')}>
            <h4 style={{ color: 'var(--uwin-emerald)' }}>Medical Officer / Doctor</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              OPD queue, patient history, e-prescriptions, and mark availability with automated patient notifications.
            </p>
          </div>

          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: 'var(--uwin-blue-light)' }} onClick={() => navigate('/login?role=facility_staff')}>
            <h4 style={{ color: 'var(--uwin-blue-light)' }}>Facility Staff Portal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              Desk arrival QR scanner, equipment &amp; bed resource counters, and emergency status.
            </p>
          </div>

          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: '#0EA5E9' }} onClick={() => navigate('/login?role=pharmacy')}>
            <h4 style={{ color: '#0EA5E9' }}>Retail / PHC Pharmacy</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              Pharmacy stock Excel upload, quantity editor, and live availability updates for citizen searches.
            </p>
          </div>

          <div className="gov-stat-box" style={{ cursor: 'pointer', borderLeftColor: '#6366F1' }} onClick={() => navigate('/login?role=district_official')}>
            <h4 style={{ color: '#6366F1' }}>District Department</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--uwin-text-muted)', marginTop: '5px' }}>
              Read-only referral funnel analytics, facility readiness board, and post-visit voice rating reports.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Frequently Asked Questions (FAQs)</div>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--uwin-text-muted)', marginBottom: '20px' }}>
          Common questions regarding AarogyaRakshak 2.0 system operation, rural citizen accessibility, and government system interoperability.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  border: '1px solid var(--uwin-border)',
                  borderRadius: '8px',
                  backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF',
                  overflow: 'hidden',
                  transition: 'background-color 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: 'var(--uwin-navy)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{faq.id}. {faq.question}</span>
                  <span style={{ fontSize: '1.2rem', marginLeft: '10px' }}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', fontSize: '0.88rem', color: 'var(--uwin-text-dark)', lineHeight: '1.6' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

