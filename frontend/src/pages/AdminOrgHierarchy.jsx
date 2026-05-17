import React, { useState } from 'react';
import './AdminPages.css';

const AdminOrgHierarchy = () => {
  return (
    <div>
      <div className="admin-header">
        <h1>Org Hierarchy View</h1>
        <div style={{display:'flex', gap:'1rem'}}>
          <button className="btn btn-outline" onClick={() => alert('Coming soon!')}>Sync from Azure AD</button>
          <button className="btn btn-primary" onClick={() => alert('Open file dialog for CSV')}>Import from CSV</button>
        </div>
      </div>

      <div className="dashboard-panel" style={{minHeight:'600px'}}>
        <div className="tree-container">
          {/* Root Level */}
          <div className="tree-node" style={{border:'2px solid #4f46e5'}}>
            <h4>CEO / Managing Director</h4>
            <p>Executive</p>
            <div style={{marginTop:'0.5rem', fontSize:'0.75rem'}}>
              <span style={{color:'#10b981', fontWeight:600}}>100% Goals Set</span>
            </div>
          </div>
          
          <div className="tree-lines">
            <div className="tree-node">
              <h4>CTO</h4>
              <p>Engineering</p>
              <div style={{marginTop:'0.5rem', fontSize:'0.75rem'}}>
                <span style={{color:'#f59e0b', fontWeight:600}}>80% Goals Set</span>
              </div>
            </div>
            <div className="tree-node">
              <h4>VP of Sales</h4>
              <p>Sales</p>
              <div style={{marginTop:'0.5rem', fontSize:'0.75rem'}}>
                <span style={{color:'#ef4444', fontWeight:600}}>40% Goals Set</span>
              </div>
            </div>
            <div className="tree-node">
              <h4>HR Director</h4>
              <p>Human Resources</p>
              <div style={{marginTop:'0.5rem', fontSize:'0.75rem'}}>
                <span style={{color:'#10b981', fontWeight:600}}>100% Goals Set</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrgHierarchy;
