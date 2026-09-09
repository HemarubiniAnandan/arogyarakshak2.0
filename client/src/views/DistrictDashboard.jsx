import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DistrictDashboard({ user }) {
  const [funnelData, setFunnelData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistrictAnalytics();
  }, [user]);

  const fetchDistrictAnalytics = async () => {
    setLoading(true);
    try {
      const fRes = await fetch('http://localhost:3001/api/referrals/stats/funnel', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const fData = await fRes.json();
      setFunnelData(fData);

      const facRes = await fetch('http://localhost:3001/api/facilities');
      const facData = await facRes.json();
      setFacilities(facData);

      const auditRes = await fetch('http://localhost:3001/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const auditData = await auditRes.json();
      setAuditLogs(auditData);
    } catch (err) {
      console.error('District analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = funnelData ? [
    { stage: 'Created', count: funnelData.funnel.created },
    { stage: 'Accepted', count: funnelData.funnel.accepted },
    { stage: 'Arrived at Facility', count: funnelData.funnel.arrived },
    { stage: 'Care Given (Completed)', count: funnelData.funnel.care_given },
  ] : [];

  return (
    <div className="gov-container">
      {/* Read-Only Government Header Notice */}
      <div className="gov-card" style={{ borderLeft: '5px solid #856404', backgroundColor: '#FFFDF0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ color: '#856404' }}>District Government Department Monitoring Console</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
              Satara District Public Health Monitoring | Read-Only Analytical Access
            </p>
          </div>
          <span className="gov-badge" style={{ backgroundColor: '#856404', color: '#FFF' }}>
            READ-ONLY ACCOUNT
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="gov-grid" style={{ marginBottom: '20px' }}>
        <div className="gov-stat-box" style={{ borderLeftColor: '#003366' }}>
          <div className="gov-stat-number">{funnelData?.total || 0}</div>
          <div className="gov-stat-label">Total Referrals Generated</div>
        </div>
        <div className="gov-stat-box" style={{ borderLeftColor: '#1E7E34' }}>
          <div className="gov-stat-number" style={{ color: '#1E7E34' }}>
            {funnelData?.conversions?.arrived_to_care_given || 0}%
          </div>
          <div className="gov-stat-label">Arrived to Care Given Conversion</div>
        </div>
        <div className="gov-stat-box" style={{ borderLeftColor: '#E05A10' }}>
          <div className="gov-stat-number" style={{ color: '#E05A10' }}>4.6 / 5.0</div>
          <div className="gov-stat-label">Average IVR Voice Rating</div>
        </div>
      </div>

      {/* Referral Funnel Visualizer */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Referral Funnel Conversion Analytics (Created -&gt; Accepted -&gt; Arrived -&gt; Care Given)</div>
        </div>

        <div style={{ height: '300px', width: '100%', marginTop: '15px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#003366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel Conversions Table */}
        <table className="gov-table" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Conversion Milestone</th>
              <th>Conversion Rate (%)</th>
              <th>Interpretation / Policy Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Created -&gt; Accepted</strong></td>
              <td>{funnelData?.conversions?.created_to_accepted || 0}%</td>
              <td>Hospital bed &amp; doctor slot acceptance rate</td>
            </tr>
            <tr>
              <td><strong>Accepted -&gt; Arrived</strong></td>
              <td>{funnelData?.conversions?.accepted_to_arrived || 0}%</td>
              <td>Patient transport adherence (ASHA accompaniment)</td>
            </tr>
            <tr>
              <td><strong>Arrived -&gt; Care Given</strong></td>
              <td>{funnelData?.conversions?.arrived_to_care_given || 0}%</td>
              <td>OPD completion efficiency rate (Target &gt; 90%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Facility Readiness Board */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Facility Readiness &amp; Emergency Operational Status</div>
        </div>

        <table className="gov-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Facility Type</th>
              <th>Emergency Service Status</th>
              <th>Readiness Score</th>
              <th>Beds Count</th>
              <th>Staff Count</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac) => (
              <tr key={fac.facility_id}>
                <td><strong>{fac.name}</strong></td>
                <td>{fac.type}</td>
                <td>
                  {fac.emergency_accepted ? (
                    <span className="gov-badge gov-badge-fresh">ACCEPTING EMERGENCIES</span>
                  ) : (
                    <span className="gov-badge gov-badge-stale">PAUSED / FULL</span>
                  )}
                </td>
                <td><strong>{fac.readiness_score} / 10</strong></td>
                <td>{fac.bed_count} beds</td>
                <td>{fac.staff_count} staff</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Trail & Event Logs */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">Immutable Audit Trail Logs</div>
        </div>
        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Reason / Description</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem' }}>{log.timestamp}</td>
                  <td><span className="gov-badge gov-badge-aging">{log.entity}</span></td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.actor}</td>
                  <td style={{ fontSize: '0.85rem' }}>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
