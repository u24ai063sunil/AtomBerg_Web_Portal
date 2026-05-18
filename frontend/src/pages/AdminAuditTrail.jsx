import React from 'react';
import './AdminPages.css';

const AdminAuditTrail = () => {
  const exportToCSV = () => {
    const csvRows = [
      ["Timestamp", "Actor", "Role", "Action", "Entity", "Reason"],
      ["2025-05-17 09:30", "John Admin", "ADMIN", "GOAL_UNLOCKED", "Goal #142", "Employee requested unlock due to typo in target metric"],
      ["2025-05-17 08:15", "Sarah Manager", "MANAGER", "GOAL_APPROVED", "Sheet #88", "—"],
      ["2025-05-16 14:20", "Mike Emp", "EMPLOYEE", "GOAL_SUBMITTED", "Sheet #88", "—"]
    ];

    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `atomquest_audit_trail_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Audit Trail</h1>
        <button className="btn btn-primary" onClick={exportToCSV}>Export to CSV</button>
      </div>

      <div className="dashboard-panel" style={{marginBottom:'2rem'}}>
        <div style={{display:'flex', gap:'1rem'}}>
          <input type="date" className="form-input" />
          <select className="form-input"><option>All Actions</option><option>GOAL_UNLOCKED</option></select>
          <select className="form-input"><option>All Actors</option></select>
          <button className="btn btn-outline">Filter</button>
        </div>
      </div>

      <div className="dashboard-panel">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-05-17 09:30</td>
              <td>John Admin</td>
              <td>ADMIN</td>
              <td><span className="audit-badge audit-red">GOAL_UNLOCKED</span></td>
              <td>Goal #142</td>
              <td>"Employee requested unlock due to typo in target metric"</td>
            </tr>
            <tr>
              <td>2025-05-17 08:15</td>
              <td>Sarah Manager</td>
              <td>MANAGER</td>
              <td><span className="audit-badge audit-green">GOAL_APPROVED</span></td>
              <td>Sheet #88</td>
              <td>—</td>
            </tr>
            <tr>
              <td>2025-05-16 14:20</td>
              <td>Mike Emp</td>
              <td>EMPLOYEE</td>
              <td><span className="audit-badge audit-purple">GOAL_SUBMITTED</span></td>
              <td>Sheet #88</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
        <div style={{marginTop:'1.5rem', display:'flex', justifyContent:'space-between', color:'#6b7280', fontSize:'0.875rem'}}>
          <span>Showing 1-20 of 1,240 entries</span>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem'}}>Prev</button>
            <button className="btn btn-outline" style={{padding:'0.25rem 0.5rem'}}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditTrail;
