import React, { useState } from 'react';

/**
 * Interactive QR Code Scanner Modal
 * Supports:
 * 1. Live Camera Scan simulation / HTML5 Camera feed
 * 2. Upload QR Code Image File
 * 3. Manual Token Code Input
 */
export default function QrScannerModal({ title, subtitle, onScanSuccess, onClose }) {
  const [tokenInput, setTokenInput] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [scanMessage, setScanMessage] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    onScanSuccess(tokenInput.trim());
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate scanning uploaded QR image file
    setScanMessage(`Scanning ${file.name}... QR Payload Extracted Successfully!`);
    setTimeout(() => {
      // Mock extract token ID from image file or name
      const mockExtractedId = 'APT-DEMO-001';
      onScanSuccess(mockExtractedId);
    }, 800);
  };

  const handleSimulateCameraScan = () => {
    setScanMessage('Scanning QR Code via Optical Camera Feed...');
    setTimeout(() => {
      onScanSuccess('APT-DEMO-001');
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 22, 44, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
      <div className="gov-card" style={{ width: '90%', maxWidth: '520px', margin: 0, borderRadius: '12px', border: '2px solid var(--gov-blue-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--gov-blue-bg)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ color: 'var(--gov-blue-primary)', margin: 0 }}>{title || 'QR Code Token Scanner'}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
              {subtitle || 'Scan patient appointment QR code or enter token ID'}
            </p>
          </div>
          <button onClick={onClose} className="gov-btn gov-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
            ✕ Close
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--gov-border)', pb: '8px' }}>
          {[
            { id: 'camera', label: 'Camera Scanner' },
            { id: 'upload', label: 'Upload QR Image' },
            { id: 'manual', label: 'Manual Token' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--gov-blue-primary)' : '3px solid transparent',
                backgroundColor: activeTab === tab.id ? 'var(--gov-blue-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--gov-blue-primary)' : 'var(--gov-text-muted)',
                cursor: 'pointer',
                borderRadius: '4px 4px 0 0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Camera Scanner Simulation */}
        {activeTab === 'camera' && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ width: '220px', height: '220px', margin: '0 auto 16px auto', border: '3px dashed var(--gov-blue-accent)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--gov-blue-primary)' }}>[SCANNER ACTIVE]</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gov-text-muted)', padding: '0 10px' }}>
                Position QR Code within optical viewfinder box
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--gov-saffron)', animation: 'scanLine 2s infinite linear' }} />
            </div>

            {scanMessage && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gov-emerald)', fontWeight: 'bold', marginBottom: '12px' }}>
                {scanMessage}
              </p>
            )}

            <button onClick={handleSimulateCameraScan} className="gov-btn gov-btn-primary" style={{ width: '100%' }}>
              Capture Camera View &amp; Verify QR Code
            </button>
          </div>
        )}

        {/* Tab 2: Upload QR Image */}
        {activeTab === 'upload' && (
          <div style={{ padding: '20px 10px', textAlign: 'center' }}>
            <div style={{ border: '2px dashed var(--gov-border-strong)', padding: '30px 15px', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                id="qrImageFileInput"
                style={{ display: 'none' }}
              />
              <label htmlFor="qrImageFileInput" className="gov-btn gov-btn-primary" style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Choose QR Image File
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-muted)' }}>
                Upload PNG, JPG, or PDF containing patient QR Token
              </p>
            </div>

            {scanMessage && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gov-emerald)', fontWeight: 'bold', marginTop: '12px' }}>
                {scanMessage}
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Manual Input */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} style={{ padding: '10px 0' }}>
            <div className="gov-form-group">
              <label className="gov-label">Appointment Token ID or Patient ABHA ID *</label>
              <input
                type="text"
                className="gov-input"
                required
                placeholder="e.g. APT-DEMO-001 or ABHA-SYNTH-001"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            <button type="submit" className="gov-btn gov-btn-success" style={{ width: '100%' }}>
              Verify &amp; Check-In Patient &rarr;
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
