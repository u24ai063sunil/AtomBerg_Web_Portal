import React, { useState } from 'react';
import './AdminPages.css';

const AdminCycleConfig = () => {
  const [activeCycle, setActiveCycle] = useState('FY 2025-26');

  const handleActivate = () => {
    if (window.confirm('This will set the active cycle for all users. Continue?')) {
      alert('Cycle Activated!');
      setActiveCycle('FY 2026-27 (Draft)');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Cycle Configuration</h1>
          <p style={{margin:0, color:'#6b7280'}}>Currently Active: <strong style={{color:'#10b981'}}>{activeCycle}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={handleActivate}>Activate Cycle</button>
      </div>

      <div className="dashboard-panel">
        <h3 style={{ marginTop: 0, marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>Edit Cycle Config</h3>
        
        <div className="config-grid">
          <div className="form-group">
            <label>Cycle Name</label>
            <input type="text" className="form-input" defaultValue="FY 2026-27 (Draft)" />
          </div>
          <div className="form-group">
            <label>Fiscal Year</label>
            <input type="text" className="form-input" defaultValue="2026-2027" />
          </div>
          <div className="form-group">
            <label>Goal Setting Opens</label>
            <input type="date" className="form-input" defaultValue="2026-05-01" />
          </div>
          <div className="form-group">
            <label>Goal Setting Deadline</label>
            <input type="date" className="form-input" defaultValue="2026-06-15" />
          </div>
          <div className="form-group">
            <label>Max Goals Per Employee</label>
            <input type="number" className="form-input" defaultValue={8} />
          </div>
          <div className="form-group">
            <label>Min Weightage Per Goal (%)</label>
            <input type="number" className="form-input" defaultValue={10} />
          </div>
        </div>

        <h4 style={{ marginTop: '2rem', color: 'var(--text-main)' }}>Quarterly Windows</h4>
        <div className="config-grid">
          <div className="form-group"><label>Q1 Open</label><input type="date" className="form-input" defaultValue="2026-07-01" /></div>
          <div className="form-group"><label>Q1 Close</label><input type="date" className="form-input" defaultValue="2026-07-31" /></div>
          <div className="form-group"><label>Q2 Open</label><input type="date" className="form-input" defaultValue="2026-10-01" /></div>
          <div className="form-group"><label>Q2 Close</label><input type="date" className="form-input" defaultValue="2026-10-31" /></div>
          <div className="form-group"><label>Q3 Open</label><input type="date" className="form-input" defaultValue="2027-01-01" /></div>
          <div className="form-group"><label>Q3 Close</label><input type="date" className="form-input" defaultValue="2027-01-31" /></div>
          <div className="form-group"><label>Q4 Open</label><input type="date" className="form-input" defaultValue="2027-03-01" /></div>
          <div className="form-group"><label>Q4 Close</label><input type="date" className="form-input" defaultValue="2027-04-30" /></div>
        </div>

        <h4 style={{ marginTop: '2rem', color: 'var(--text-main)' }}>Thrust Areas</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {['Sales & Revenue', 'Customer Success', 'Operational Efficiency', 'Product Quality'].map(t => (
            <div key={t} style={{ padding: '0.5rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              {t} <span style={{ cursor: 'pointer', color: 'var(--error)', fontWeight: 'bold' }}>×</span>
            </div>
          ))}
          <div style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: '999px', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + Add New
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCycleConfig;
