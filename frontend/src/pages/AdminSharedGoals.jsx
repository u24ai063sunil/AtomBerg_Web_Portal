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
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'white', borderRadius:'16px', padding:'2rem', width:'600px', maxHeight:'90vh', overflowY:'auto'}}>
            <h2 style={{marginTop:0}}>Push New Shared Goal</h2>
            <div className="form-group">
              <label>Goal Title</label>
              <input type="text" className="form-input" placeholder="e.g. Org-wide compliance training" />
            </div>
            <div className="form-group">
              <label>Target</label>
              <input type="text" className="form-input" />
            </div>
            <div className="form-group">
              <label>Select Recipients</label>
              <div style={{padding:'1rem', border:'1px solid #d1d5db', borderRadius:'8px'}}>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" /> Push to entire organization</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.5rem'}}><input type="checkbox" /> Engineering Dept</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.5rem'}}><input type="checkbox" /> Sales Dept</label>
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop:'2rem'}}>
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
