import React from 'react';
import './AdminPages.css';

const AdminReports = () => {
  const handleExport = (format, type) => {
    alert(`Exporting ${type} as ${format}...`);
    // In a real implementation, use SheetJS:
    // const ws = XLSX.utils.json_to_sheet(data);
    // const wb = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(wb, ws, "Report");
    // XLSX.writeFile(wb, `Report.${format}`);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Reports & Export</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3>Achievement Report</h3>
            <div style={{display:'flex', gap:'0.5rem'}}>
              <button className="btn btn-outline" onClick={() => handleExport('csv', 'Achievement')}>CSV</button>
              <button className="btn btn-primary" onClick={() => handleExport('xlsx', 'Achievement')}>XLSX</button>
            </div>
          </div>
          <p style={{color:'#6b7280', fontSize:'0.875rem', margin:'0 0 1rem 0'}}>
            Comprehensive data including Emp ID, Name, Dept, Manager, Goal details, Target, and Q1-Q4 Planned/Actual scores.
          </p>
        </div>

        <div className="dashboard-panel">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3>Completion Report</h3>
            <button className="btn btn-outline" onClick={() => handleExport('csv', 'Completion')}>CSV</button>
          </div>
          <p style={{color:'#6b7280', fontSize:'0.875rem', margin:'0 0 1rem 0'}}>
            Tracking of who submitted, approved, and completed check-ins by quarter.
          </p>
        </div>

        <div className="dashboard-panel">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3>Audit Report</h3>
            <button className="btn btn-outline" onClick={() => handleExport('csv', 'Audit')}>CSV</button>
          </div>
          <p style={{color:'#6b7280', fontSize:'0.875rem', margin:'0 0 1rem 0'}}>
            Full audit log dump for the entire cycle. Includes immutable timestamps, actors, and reasons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
