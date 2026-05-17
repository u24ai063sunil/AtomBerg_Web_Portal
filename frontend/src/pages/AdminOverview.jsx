import React, { useState } from 'react';
import './AdminPages.css';

const AdminOverview = () => {
  return (
    <div>
      <div className="admin-header">
        <h1>Admin Overview Dashboard</h1>
        <button className="btn btn-primary">Download Summary Report</button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card"><span className="kpi-label">Total Employees</span><span className="kpi-value">127</span></div>
        <div className="kpi-card"><span className="kpi-label">Goal Submission Rate</span><span className="kpi-value" style={{color:'#10b981'}}>89%</span></div>
        <div className="kpi-card"><span className="kpi-label">Q1 Check-in Rate</span><span className="kpi-value" style={{color:'#f59e0b'}}>62%</span></div>
        <div className="kpi-card"><span className="kpi-label">Shared Goals Active</span><span className="kpi-value" style={{color:'#8b5cf6'}}>4</span></div>
        <div className="kpi-card"><span className="kpi-label">Pending Escalations</span><span className="kpi-value" style={{color:'#ef4444'}}>14</span></div>
        <div className="kpi-card"><span className="kpi-label">Unlock Requests</span><span className="kpi-value" style={{color:'#ef4444'}}>3</span></div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h3>Department Completion</h3>
          {/* Simple horizontal bar chart using CSS */}
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {['Engineering', 'Sales', 'Marketing', 'HR'].map(dept => (
              <div key={dept}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.875rem', marginBottom:'0.25rem', fontWeight:600}}>
                  <span>{dept}</span>
                  <span style={{color:'#6b7280'}}>90% Submitted | 75% Check-ins</span>
                </div>
                <div style={{width:'100%', height:'12px', background:'#f3f4f6', borderRadius:'6px', display:'flex', overflow:'hidden'}}>
                  <div style={{width:'90%', background:'#8b5cf6', height:'100%'}}></div>
                  <div style={{width:'75%', background:'#10b981', height:'100%', marginLeft:'-90%', mixBlendMode:'multiply'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <h3>Recent Audit Activity</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {[
              { id: 1, action: 'GOAL_APPROVED', actor: 'John Doe', entity: 'Goal Sheet #12', time: '10 mins ago', color: 'audit-green' },
              { id: 2, action: 'GOAL_SUBMITTED', actor: 'Alice Smith', entity: 'Goal Sheet #45', time: '1 hour ago', color: 'audit-purple' },
              { id: 3, action: 'GOAL_UNLOCKED', actor: 'Admin (You)', entity: 'Goal #8', time: '2 hours ago', color: 'audit-red' },
            ].map(log => (
              <div key={log.id} style={{borderBottom:'1px solid #f3f4f6', paddingBottom:'0.5rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem'}}>
                  <span className={`audit-badge ${log.color}`}>{log.action.replace('_', ' ')}</span>
                  <span style={{fontSize:'0.75rem', color:'#9ca3af'}}>{log.time}</span>
                </div>
                <div style={{fontSize:'0.875rem'}}>
                  <strong>{log.actor}</strong> modified <span>{log.entity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
