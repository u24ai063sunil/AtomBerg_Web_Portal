import React, { useState } from 'react';
import './AdminPages.css';

const AdminSharedGoals = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="admin-header">
        <h1>Shared Goals Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Push New Shared Goal</button>
      </div>

      <div className="dashboard-panel">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Goal Title</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Pushed To</th>
              <th>Primary Owner</th>
              <th>Latest Achievement</th>
              <th>Last Synced</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{fontWeight:600}}>Reduce Cloud Costs</td>
              <td>MAX</td>
              <td>$50k</td>
              <td>12 Employees</td>
              <td>Alice Smith</td>
              <td style={{color:'#10b981', fontWeight:600}}>$42k</td>
              <td>2 days ago</td>
              <td>
                <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem', marginRight:'0.5rem'}}>Sync Now</button>
                <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem'}}>Edit</button>
              </td>
            </tr>
            <tr>
              <td style={{fontWeight:600}}>Q3 Sales Target (West)</td>
              <td>MIN</td>
              <td>1.5 Cr</td>
              <td>8 Employees</td>
              <td>Bob Johnson</td>
              <td style={{color:'#f59e0b', fontWeight:600}}>0.8 Cr</td>
              <td>Today</td>
              <td>
                <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem', marginRight:'0.5rem'}}>Sync Now</button>
                <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem'}}>Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Push New Shared Goal</h2>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Goal Title</label>
              <input type="text" className="form-input" placeholder="e.g. Org-wide compliance training" style={{ marginTop: '0.5rem' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Target</label>
              <input type="text" className="form-input" placeholder="e.g. 100% completion" style={{ marginTop: '0.5rem' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Select Recipients</label>
              <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> Push to entire organization
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> Engineering Dept
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> Sales Dept
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('Goal Pushed!'); setShowModal(false); }}>Review & Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSharedGoals;
