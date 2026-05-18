import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Share2, 
  CheckSquare, 
  ShieldAlert, 
  Download 
} from 'lucide-react';
import './AdminPages.css';

// Import subcomponents
import AdminOrgHierarchy from './AdminOrgHierarchy';
import AdminCycleConfig from './AdminCycleConfig';
import AdminSharedGoals from './AdminSharedGoals';
import AdminCompletionStatus from './AdminCompletionStatus';
import AdminAuditTrail from './AdminAuditTrail';

const AdminOverview = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'hierarchy', name: 'User & Hierarchy', icon: <Users size={18} /> },
    { id: 'cycle', name: 'Goal Cycle Config', icon: <Settings size={18} /> },
    { id: 'shared', name: 'Shared Goals', icon: <Share2 size={18} /> },
    { id: 'completion', name: 'Completion Status', icon: <CheckSquare size={18} /> },
    { id: 'audit', name: 'Audit Trail', icon: <ShieldAlert size={18} /> }
  ];

  return (
    <div className="admin-container">
      {/* Local Sub-Sidebar inside the Admin Console */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Console Navigation</h3>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--bg-input)' : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main" style={{ flex: 1, padding: '2rem', height: '100vh', overflowY: 'auto' }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'hierarchy' && <AdminOrgHierarchy />}
        {activeTab === 'cycle' && <AdminCycleConfig />}
        {activeTab === 'shared' && <AdminSharedGoals />}
        {activeTab === 'completion' && <AdminCompletionStatus />}
        {activeTab === 'audit' && <AdminAuditTrail />}
      </main>
    </div>
  );
};

// Main Overview tab component
const OverviewTab = () => {
  const downloadSummaryReport = () => {
    const csvRows = [
      ["AtomQuest Summary Report"],
      ["Generated At", new Date().toLocaleString()],
      [],
      ["Key Performance Indicators"],
      ["Metric", "Value"],
      ["Total Employees", "127"],
      ["Goal Submission Rate", "89%"],
      ["Q1 Check-in Rate", "62%"],
      ["Shared Goals Active", "4"],
      [],
      ["Department Completion Statistics"],
      ["Department", "Submitted Rate", "Check-in Rate"],
      ["Engineering", "95%", "80%"],
      ["Sales", "88%", "55%"],
      ["Marketing", "90%", "60%"],
      ["HR & Finance", "100%", "90%"]
    ];

    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `atomquest_summary_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Admin Overview Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time completion monitoring, department insights, and active goal cycles.</p>
        </div>
        <button className="btn btn-primary" onClick={downloadSummaryReport}>
          <Download size={16} /> Download Summary Report
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label">Total Employees</span>
          <span className="kpi-value">127</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Goal Submission Rate</span>
          <span className="kpi-value" style={{ color: '#10b981' }}>89%</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Q1 Check-in Rate</span>
          <span className="kpi-value" style={{ color: '#f59e0b' }}>62%</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Shared Goals Active</span>
          <span className="kpi-value" style={{ color: '#8b5cf6' }}>4</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h3>Department Completion</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { dept: 'Engineering', submitted: '95%', checkin: '80%', subVal: 95, checkVal: 80 },
              { dept: 'Sales', submitted: '88%', checkin: '55%', subVal: 88, checkVal: 55 },
              { dept: 'Marketing', submitted: '90%', checkin: '60%', subVal: 90, checkVal: 60 },
              { dept: 'HR & Finance', submitted: '100%', checkin: '90%', subVal: 100, checkVal: 90 }
            ].map(row => (
              <div key={row.dept}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-main)' }}>{row.dept}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{row.submitted} Submitted | {row.checkin} Check-ins</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${row.subVal}%`, background: 'var(--primary)', height: '100%', borderRadius: '6px' }}></div>
                  <div style={{ width: `${row.checkVal}%`, background: 'var(--success)', height: '100%', borderRadius: '6px', position: 'absolute', top: 0, left: 0, opacity: 0.75 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <h3>Recent Audit Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { id: 1, action: 'GOAL_APPROVED', actor: 'John Doe', entity: 'Goal Sheet #12', time: '10 mins ago', color: 'audit-green' },
              { id: 2, action: 'GOAL_SUBMITTED', actor: 'Alice Smith', entity: 'Goal Sheet #45', time: '1 hour ago', color: 'audit-purple' },
              { id: 3, action: 'GOAL_UNLOCKED', actor: 'Admin (You)', entity: 'Goal #8', time: '2 hours ago', color: 'audit-red' },
            ].map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className={`audit-badge ${log.color}`}>{log.action.replace('_', ' ')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
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
