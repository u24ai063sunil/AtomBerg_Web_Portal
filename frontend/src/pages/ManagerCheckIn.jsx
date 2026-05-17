import React, { useState } from 'react';
import './ManagerCheckIn.css';

const DownloadIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);

const mockData = [
  { id: 'g1', employeeName: 'Alice Smith', title: 'Increase Q3 Revenue', uomType: 'MIN', target: '2.5 Cr', q1Planned: '0.5 Cr', q1Actual: '0.6 Cr', score: 120, status: 'ON_TRACK' },
  { id: 'g2', employeeName: 'Alice Smith', title: 'Reduce Churn', uomType: 'MAX', target: '5%', q1Planned: '8%', q1Actual: '7%', score: 114, status: 'ON_TRACK' },
  { id: 'g3', employeeName: 'Charlie Davis', title: 'Server Migration', uomType: 'TIMELINE', target: 'Oct 31', q1Planned: 'N/A', q1Actual: 'In Progress', score: 0, status: 'NOT_STARTED' },
];

const template = `Performance this quarter: \n\nKey achievements: \n\nAreas to improve: \n\nSupport needed: \n`;

const ManagerCheckIn = () => {
  const [viewAllQuarters, setViewAllQuarters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [comments, setComments] = useState({});

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    if (!comments[id]) {
      setComments({ ...comments, [id]: template });
    }
  };

  const handleCommentChange = (id, val) => {
    setComments({ ...comments, [id]: val });
  };

  const saveComment = (id) => {
    alert('Comment saved to database!');
    setExpandedId(null);
  };

  const handleExport = () => {
    alert('Downloading Team_Checkin_Report.xlsx');
  };

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <h1>Quarterly Check-ins (Q1)</h1>
        <div className="header-actions">
          <label className="toggle-container">
            <input 
              type="checkbox" 
              checked={viewAllQuarters} 
              onChange={(e) => setViewAllQuarters(e.target.checked)} 
            />
            View All Quarters
          </label>
          <button className="btn-export" onClick={handleExport}>
            <DownloadIcon /> Export to Excel
          </button>
        </div>
      </div>

      <div className="checkin-table-wrapper">
        <table className="checkin-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Goal Title</th>
              <th>UoM</th>
              <th>Annual Target</th>
              <th>Q1 Planned</th>
              <th>Q1 Actual</th>
              {viewAllQuarters && <th>Q2 / Q3 / Q4</th>}
              <th>Score %</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <React.Fragment key={row.id}>
                <tr className="row-main">
                  <td style={{fontWeight: 600}}>{row.employeeName}</td>
                  <td>{row.title}</td>
                  <td>{row.uomType}</td>
                  <td>{row.target}</td>
                  <td>{row.q1Planned}</td>
                  <td style={{fontWeight: 600, color: '#4f46e5'}}>{row.q1Actual}</td>
                  {viewAllQuarters && <td style={{color:'#9ca3af'}}>Locked / Locked / Locked</td>}
                  <td>
                    <span style={{color: row.score >= 100 ? '#10b981' : row.score > 0 ? '#f59e0b' : '#6b7280', fontWeight: 700}}>
                      {row.score > 0 ? `${row.score}%` : '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${row.status}`}>{row.status.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <button className="expand-btn" onClick={() => handleExpand(row.id)}>
                      {expandedId === row.id ? 'Close' : 'Manager Comment'}
                    </button>
                  </td>
                </tr>
                {expandedId === row.id && (
                  <tr className="row-expanded">
                    <td colSpan={viewAllQuarters ? 10 : 9}>
                      <div className="comment-section">
                        <div className="comment-header">
                          <span>Q1 Manager Evaluation for {row.employeeName}</span>
                          <span style={{color:'#6b7280', fontWeight:'normal', fontSize:'0.875rem'}}>Drafting...</span>
                        </div>
                        <textarea 
                          className="comment-textarea"
                          rows="8"
                          value={comments[row.id]}
                          onChange={(e) => handleCommentChange(row.id, e.target.value)}
                        />
                        <button className="btn-save" onClick={() => saveComment(row.id)}>Save Comment</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerCheckIn;
