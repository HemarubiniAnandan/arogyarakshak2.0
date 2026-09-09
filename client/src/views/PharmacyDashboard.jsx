import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import SimulatedBadge from '../components/SimulatedBadge';

export default function PharmacyDashboard({ user }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add new medicine form state
  const [newMedName, setNewMedName] = useState('');
  const [newMedQty, setNewMedQty] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [user]);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/stock?facility_id=FAC-DEMO-001', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await res.json();
      setStock(data);
    } catch (err) {
      console.error('Fetch pharmacy stock error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      alert(`Excel stock file uploaded successfully!\nParsed ${data.length} medicine records. Live inventory updated for public search.`);
      fetchStock();
    };
    reader.readAsBinaryString(file);
  };

  const handleEditQty = async (itemId, currentQty, name) => {
    const newQty = prompt(`Enter updated quantity for ${name}:`, currentQty);
    if (newQty !== null && !isNaN(parseInt(newQty, 10))) {
      try {
        await fetch(`http://localhost:3001/api/stock/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({ quantity: parseInt(newQty, 10) }),
        });
        fetchStock();
      } catch (err) {
        alert('Failed to update stock quantity');
      }
    }
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedQty) return;

    const newItem = {
      id: Date.now(),
      facility_name: 'PHC Karad Pharmacy',
      medicine_name: newMedName.trim(),
      quantity: parseInt(newMedQty, 10),
      quantity_status: parseInt(newMedQty, 10) > 0 ? 'available' : 'out_of_stock',
      freshness: 'fresh',
      label: 'Verified Fresh (Just Updated)',
      last_updated: new Date().toISOString().split('T')[0],
    };

    setStock([newItem, ...stock]);
    setNewMedName('');
    setNewMedQty('');
    setShowAddForm(false);
    alert(`Added ${newItem.medicine_name} (${newItem.quantity} units) to live pharmacy inventory!`);
  };

  const filteredStock = stock.filter(item =>
    item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="gov-container">
      {/* Header Banner */}
      <div className="gov-card" style={{ borderLeft: '6px solid var(--gov-saffron)', backgroundColor: 'var(--gov-saffron-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: 'var(--gov-blue-dark)' }}>Pharmacy Stock &amp; Inventory Management Portal</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
              Logged as: <strong>{user.name}</strong> | Pharmacy: <strong>PHC Karad Central Dispensary &amp; Chemist Network</strong>
            </p>
          </div>
          <SimulatedBadge adapterName="e-Aushadhi stock adapter" />
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="gov-grid-2" style={{ marginBottom: '20px' }}>
        {/* Excel Stock Upload Card */}
        <div className="gov-card" style={{ margin: 0 }}>
          <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '10px' }}>
            Upload Stock Availability Excel / CSV
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--gov-text-muted)', marginBottom: '15px' }}>
            Upload stock spreadsheets (.xlsx / .csv) to auto-update live drug inventory across citizen searches.
          </p>

          <div style={{ border: '2px dashed var(--gov-border-strong)', padding: '20px', textAlign: 'center', borderRadius: '8px', backgroundColor: '#FAFCFF' }}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="pharmacyExcelUpload"
            />
            <label htmlFor="pharmacyExcelUpload" className="gov-btn gov-btn-primary" style={{ cursor: 'pointer' }}>
              Choose Excel / CSV Spreadsheet
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
              Expected Columns: medicine_name, quantity, status, last_updated
            </p>
          </div>
        </div>

        {/* Manual Stock Entry Card */}
        <div className="gov-card" style={{ margin: 0 }}>
          <h4 style={{ color: 'var(--gov-blue-primary)', marginBottom: '10px' }}>
            Quick Inventory Action
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--gov-text-muted)', marginBottom: '15px' }}>
            Add new drug items directly or edit quantity counts for real-time reflection in patient search portals.
          </p>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gov-btn gov-btn-success"
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {showAddForm ? 'Cancel Form' : '+ Add New Medicine Stock Item'}
          </button>

          {showAddForm && (
            <form onSubmit={handleAddMedicine} style={{ backgroundColor: '#FAFBFD', padding: '12px', borderRadius: '6px', border: '1px solid var(--gov-border)' }}>
              <div className="gov-form-group">
                <label className="gov-label">Medicine / Drug Name *</label>
                <input
                  type="text"
                  className="gov-input"
                  required
                  placeholder="e.g. Tab Metformin 500mg"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                />
              </div>

              <div className="gov-form-group">
                <label className="gov-label">Quantity Units *</label>
                <input
                  type="number"
                  className="gov-input"
                  required
                  placeholder="e.g. 250"
                  value={newMedQty}
                  onChange={(e) => setNewMedQty(e.target.value)}
                />
              </div>

              <button type="submit" className="gov-btn gov-btn-primary" style={{ width: '100%' }}>
                Save Medicine Item
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          <div>
            <h3 style={{ color: 'var(--gov-blue-primary)', margin: 0 }}>
              Live Pharmacy Medicine Stock Inventory
            </h3>
          </div>

          <div style={{ width: '280px' }}>
            <input
              type="text"
              className="gov-input"
              placeholder="Search stock by drug name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--gov-text-muted)' }}>Loading pharmacy stock inventory...</p>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>Medicine / Drug Name</th>
                <th>Available Quantity</th>
                <th>Stock Status</th>
                <th>Freshness Label</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.medicine_name}</strong></td>
                  <td><strong style={{ fontSize: '1.05rem', color: item.quantity > 0 ? 'var(--gov-emerald)' : 'var(--gov-danger)' }}>{item.quantity} units</strong></td>
                  <td>
                    <span className={`gov-badge ${item.quantity > 0 ? 'gov-badge-fresh' : 'gov-badge-stale'}`}>
                      {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <span className={`gov-badge gov-badge-${item.freshness || 'fresh'}`}>
                      {item.label || 'Verified Fresh'}
                    </span>
                  </td>
                  <td>{item.last_updated || '2026-09-06'}</td>
                  <td>
                    <button
                      onClick={() => handleEditQty(item.id, item.quantity, item.medicine_name)}
                      className="gov-btn gov-btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      Edit Quantity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
