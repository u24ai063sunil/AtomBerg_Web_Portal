import React, { useState } from 'react';
import './Escalation.css';

const mockLogs = [
  { id: 1, rule: 'NO_SUBMISSION', triggeredFor: 'Alice Smith (Emp)', level: 'Level 2 (Manager)', sentTo: 'alice@atomberg.com, bob_mgr@atomberg.com', sentAt: '2025-05-16 08:00', status: 'PENDING', resolvedBy: null },
  { id: 2, rule: 'NO_APPROVAL', triggeredFor: 'Bob Manager', level: 'Level 3 (HR)', sentTo: 'bob_mgr@atomberg.com, charlie_vp@atomberg.com, hr@atomberg.com', sentAt: '2025-05-15 08:00', status: 'RESOLVED', resolvedBy: 'System Auto-resolve' },
  { id: 3, rule: 'NO_CHECKIN', triggeredFor: 'David Dev', level: 'Level 1 (Emp)', sentTo: 'david@atomberg.com', sentAt: '2025-05-14 08:00', status: 'IGNORED', resolvedBy: 'Admin (Manual)' }
];

const EscalationLogsPage = () => {
  const [logs, setLogs] = useState(mockLogs);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNote, setResolveNote] = useState('');

  const getTypeClass = (type) => {
    if(type === 'NO_SUBMISSION') return 'type-submission';
    if(type === 'NO_APPROVAL') return 'type-approval';
    return 'type-checkin';
  };

  const handleResolve = () => {
    setLogs(logs.map(l => l.id === resolvingId ? { ...l, status: 'RESOLVED', resolvedBy: `Admin: ${resolveNote}` } : l));
    setResolvingId(null);
    setResolveNote('');
  };

  return (
    <div className="escalation-container">
      <div className="escalation-header">
        <div>
          <h1>Escalation Logs</h1>
          <p style={{color:'#6b7280', margin:0}}>Audit trail of all automated warnings sent by the cron engine.</p>
        </div>
        <button className="btn btn-outline">Export to CSV</button>
      </div>

      <div className="filter-bar">
        <select className="filter-input"><option>All Rule Types</option><option>NO_SUBMISSION</option></select>
        <select className="filter-input"><option>All Statuses</option><option>PENDING</option><option>RESOLVED</option></select>
        <input type="text" className="filter-input" placeholder="Search user..." style={{flex:1}} />
        <button className="btn btn-primary">Filter</button>
      </div>

      <div className="escalation-panel">
        <table className="escalation-table">
          <thead>
            <tr>
              <th>Triggered Rule</th>
              <th>Triggered For</th>
              <th>Escalation Level</th>
              <th>Sent To (Emails)</th>
              <th>Sent At</th>
              <th>Status</th>
              <th>Resolved By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td><span className={`type-badge ${getTypeClass(log.rule)}`}>{log.rule.replace('_', ' ')}</span></td>
                <td style={{fontWeight:500}}>{log.triggeredFor}</td>
                <td>{log.level}</td>
                <td style={{fontSize:'0.75rem', color:'#6b7280'}}>{log.sentTo}</td>
                <td>{log.sentAt}</td>
                <td><span className={`status-badge status-${log.status}`}>{log.status}</span></td>
                <td style={{fontSize:'0.75rem'}}>{log.resolvedBy || '—'}</td>
                <td>
                  {log.status === 'PENDING' && (
                    <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem'}} onClick={() => setResolvingId(log.id)}>Mark Resolved</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resolvingId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Manual Resolution</h3>
            <p>You are marking this escalation as manually resolved. Please provide a reason.</p>
            <textarea 
              className="form-input" 
              rows="4" 
              placeholder="e.g. Discussed with employee over Slack"
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              style={{width:'100%', boxSizing:'border-box'}}
            ></textarea>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setResolvingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResolve} disabled={!resolveNote.trim()}>Resolve Escalation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationLogsPage;
