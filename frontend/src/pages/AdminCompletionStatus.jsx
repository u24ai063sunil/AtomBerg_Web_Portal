import React, { useState } from 'react';
import './AdminPages.css';

const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const mockData = [
  { dept: 'Engineering', employees: [
    { name: 'Alice Smith', weeks: WEEKS.map(w => w < 12 ? 'green' : w < 15 ? 'yellow' : 'gray') },
    { name: 'Bob Johnson', weeks: WEEKS.map(w => w < 10 ? 'green' : w < 15 ? 'red' : 'gray') }
  ]},
  { dept: 'Sales', employees: [
    { name: 'Charlie Davis', weeks: WEEKS.map(w => w < 14 ? 'green' : 'orange') }
  ]}
];

const AdminCompletionStatus = () => {
  return (
    <div>
      <div className="admin-header">
        <h1>Completion Status (Heatmap)</h1>
        <div style={{display:'flex', gap:'1rem'}}>
          <select className="form-input" style={{padding:'0.5rem'}}><option>All Departments</option></select>
          <button className="btn btn-primary">Send Reminders (Batch)</button>
        </div>
      </div>

      <div className="dashboard-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div className="heatmap-container">
          {/* Header Row */}
          <div></div>
          {WEEKS.map(w => (
            <div key={w} className="heatmap-header" style={{ color: 'var(--text-muted)' }}>W{w}</div>
          ))}

          {/* Data Rows */}
          {mockData.map(dept => (
            <React.Fragment key={dept.dept}>
              <div style={{ gridColumn: '1 / -1', padding: '1rem 0 0.5rem 0', fontWeight: 700, borderBottom: '1px solid var(--border)', color: 'var(--primary)', fontSize: '1rem' }}>{dept.dept}</div>
              {dept.employees.map(emp => (
                <React.Fragment key={emp.name}>
                  <div className="heatmap-row-label" style={{ color: 'var(--text-main)' }}>
                    <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                    {emp.name}
                  </div>
                  {emp.weeks.map((status, i) => (
                    <div 
                      key={i} 
                      className={`heatmap-cell cell-${status}`} 
                      data-tooltip={`${emp.name} — W${i+1}: ${status === 'green' ? 'Check-in Done' : status === 'yellow' ? 'Submitted' : status === 'red' ? 'Not Started' : 'Pending'}`}
                    />
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="heatmap-cell cell-green" style={{ width: '16px', height: '16px', borderRadius: '4px' }}></div> Check-in Done</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="heatmap-cell cell-yellow" style={{ width: '16px', height: '16px', borderRadius: '4px' }}></div> Submitted</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="heatmap-cell cell-orange" style={{ width: '16px', height: '16px', borderRadius: '4px' }}></div> Pending</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="heatmap-cell cell-red" style={{ width: '16px', height: '16px', borderRadius: '4px' }}></div> Not Started</div>
        </div>
      </div>
    </div>
  );
};

export default AdminCompletionStatus;
