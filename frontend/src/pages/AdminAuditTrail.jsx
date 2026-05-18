import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminAuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filterType, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let url = `${API_URL}/admin/audit-log?page=${page}`;
      if (filterType) {
        url += `&entityType=${filterType}`;
      }

      const res = await axios.get(url, { headers });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        // Hardcode a dynamic estimate of total entries for pagination since skip/limit is applied
        setTotalCount((res.data.data?.length || 0) < 20 ? (page - 1) * 20 + (res.data.data?.length || 0) : page * 20 + 40);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const csvRows = [
      ["Timestamp", "Actor ID", "Entity Type", "Action", "Entity ID", "Reason / Comment"],
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.actorId || 'System / Auto',
        log.entityType || '—',
        log.action || '—',
        log.entityId || '—',
        log.details?.reason || log.comment || '—'
      ])
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
    <div className="animate-fade-in">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Audit Trail Console</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0 0' }}>Trace system transactions, locks, role modifications, and approvals.</p>
        </div>
        <button className="btn btn-primary" onClick={exportToCSV} disabled={logs.length === 0}>
          Export to CSV
        </button>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter Entity Type:</span>
          <select 
            className="form-input" 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            style={{ width: '200px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px' }}
          >
            <option value="">All Transactions</option>
            <option value="GOALSHEET">Goal Sheets</option>
            <option value="GOAL">Individual Goals</option>
            <option value="USER">User / Role Adjustments</option>
            <option value="CHECKIN">Check-Ins</option>
          </select>
          <button className="btn btn-outline" onClick={fetchLogs} style={{ padding: '0.5rem 1rem' }}>Refresh</button>
        </div>
      </div>

      <div className="dashboard-panel">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>Loading system audit trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <h3>No audit transactions found.</h3>
            <p>Perform a check-in or submit a goalsheet to register the first system log.</p>
          </div>
        ) : (
          <>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Action Taken</th>
                  <th>Reason / Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>👥 {log.actorId ? `User (${log.actorId.slice(-6)})` : 'System / Auto'}</td>
                    <td>
                      <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <span className={`audit-badge ${log.action?.includes('APPROVE') ? 'audit-green' : log.action?.includes('RETURN') ? 'audit-red' : 'audit-purple'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        {log.details?.reason || log.comment || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              <span>Showing 1-{logs.length} entries</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.25rem 0.75rem' }}
                >
                  Prev
                </button>
                <button 
                  className="btn btn-outline" 
                  disabled={logs.length < 20} 
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '0.25rem 0.75rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAuditTrail;
