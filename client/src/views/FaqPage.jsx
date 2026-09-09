import React, { useState } from 'react';

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'What is AarogyaRakshak 2.0?',
      answer: 'AarogyaRakshak 2.0 is an offline-first, ASHA-worker-assisted rural healthcare interoperability platform developed for the Public Health Department, Government of Maharashtra. It bridges existing digital health portals (U-WIN, e-Aushadhi, eSanjeevani, ABDM) without replacing them.',
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
    {
      id: 7,
      question: 'How does QR code scanning work in Primary Health Centres?',
      answer: 'Primary Health Centres utilize a 2-stage verification system: (1) Facility Staff scan the patient appointment QR code upon arrival at the OPD desk to mark status as Arrived; (2) The Medical Officer confirms consultation room arrival and completion in their doctor portal, recording Care Given and attaching structured e-prescriptions.',
    },
    {
      id: 8,
      question: 'How is pharmacy stock updated and tracked?',
      answer: 'Pharmacy staff can upload weekly medicine availability Excel spreadsheets (.xlsx/.csv) or update inventory quantities directly in the Pharmacy Portal. Live stock levels automatically reflect in citizen medicine searches and e-prescription fulfillment.',
    },
  ];

  return (
    <div className="gov-container">
      {/* Banner */}
      <div className="gov-card" style={{ background: 'linear-gradient(135deg, #003366 0%, #001A33 100%)', color: '#FFF' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#D4AF37', marginBottom: '10px' }}>
          Frequently Asked Questions (FAQ)
        </h2>
        <p style={{ fontSize: '0.98rem', color: '#E0E8F0', maxWidth: '850px' }}>
          Comprehensive operational, technical, and workflow documentation for citizens, health workers, doctors, and district officials.
        </p>
      </div>

      {/* Accordion List */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">System &amp; Interoperability FAQ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  border: '1px solid var(--gov-border)',
                  borderRadius: '4px',
                  backgroundColor: isOpen ? '#FAFBFD' : '#FFF',
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
                    color: 'var(--gov-blue-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{faq.id}. {faq.question}</span>
                  <span style={{ fontSize: '1.2rem', marginLeft: '10px' }}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', fontSize: '0.88rem', color: 'var(--gov-text-dark)', lineHeight: '1.6' }}>
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
