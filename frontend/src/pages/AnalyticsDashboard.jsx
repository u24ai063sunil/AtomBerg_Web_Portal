import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import './AnalyticsDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- MOCK DATA ---
const trendData = [
  { name: 'Q1', planned: 25, actual: 28 },
  { name: 'Q2', planned: 50, actual: 45 },
  { name: 'Q3', planned: 75, actual: 80 },
  { name: 'Q4', planned: 100, actual: null },
];

const goalScoreData = [
  { name: 'Goal 1', score: 110, weightage: 30, uom: 'MIN', fill: '#3b82f6' },
  { name: 'Goal 2', score: 85, weightage: 40, uom: 'MAX', fill: '#10b981' },
  { name: 'Goal 3', score: 50, weightage: 20, uom: 'TIMELINE', fill: '#8b5cf6' },
  { name: 'Goal 4', score: 100, weightage: 10, uom: 'ZERO', fill: '#f59e0b' },
];

const qoqData = [
  { name: 'Q1', current: 85, previous: 70 },
  { name: 'Q2', current: 90, previous: 75 },
  { name: 'Q3', current: 88, previous: 80 },
  { name: 'Q4', current: null, previous: 85 },
];

const thrustAreaData = [
  { name: 'Sales & Rev', value: 400, color: '#4f46e5' },
  { name: 'Ops Efficiency', value: 300, color: '#10b981' },
  { name: 'Quality', value: 300, color: '#f59e0b' },
  { name: 'Innovation', value: 200, color: '#ec4899' },
];

const uomData = [
  { name: 'Min', value: 50 }, { name: 'Max', value: 30 }, { name: 'Timeline', value: 15 }, { name: 'Zero', value: 5 }
];
const UOM_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const teamHeatmapData = [
  { name: 'Alice', scores: [90, 110, 80, 100, 75] },
  { name: 'Bob', scores: [60, 40, 50, 80, 90] },
  { name: 'Charlie', scores: [120, 100, 95, 110, 105] }
];

const getHeatmapColor = (score) => {
  if (score >= 100) return `rgba(16, 185, 129, 1)`; // Green
  if (score >= 80) return `rgba(16, 185, 129, 0.6)`;
  if (score >= 50) return `rgba(245, 158, 11, 0.8)`; // Yellow
  return `rgba(239, 68, 68, 0.8)`; // Red
};


const AnalyticsDashboard = () => {
  const [roleView, setRoleView] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(true);
  const [cascadeData, setCascadeData] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchCascadeData();
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [roleView]);

  const fetchCascadeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/goals/cascade`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setCascadeData(res.data.cascade || []);
      }
    } catch (err) {
      console.error("Failed to fetch cascade data", err);
    }
  };

  const handleExport = (e, chartName) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const panel = btn.closest('.chart-panel');
    if (!panel) return;

    const svgElement = panel.querySelector('svg');
    if (!svgElement) {
      if (chartName === 'Team Heatmap') {
        const csvRows = [
          ["Team Heatmap Score Report"],
          ["Employee", "Goal 1", "Goal 2", "Goal 3", "Goal 4", "Goal 5"],
          ...teamHeatmapData.map(row => [row.name, ...row.scores.map(s => `${s}%`)])
        ];
        const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "team_heatmap_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      alert('Could not find chart to export.');
      return;
    }

    try {
      const bbox = svgElement.getBoundingClientRect();
      const width = bbox.width || 500;
      const height = bbox.height || 300;

      const svgClone = svgElement.cloneNode(true);
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);

      const originalElements = svgElement.querySelectorAll('*');
      const cloneElements = svgClone.querySelectorAll('*');
      for (let i = 0; i < originalElements.length; i++) {
        const orig = originalElements[i];
        const cln = cloneElements[i];
        if (orig && cln) {
          const computed = window.getComputedStyle(orig);
          cln.style.fontFamily = computed.fontFamily || 'Outfit, sans-serif';
          cln.style.fontSize = computed.fontSize;
          cln.style.fontWeight = computed.fontWeight;
          
          if (computed.fill && computed.fill !== 'none') {
            cln.setAttribute('fill', computed.fill);
          }
          if (computed.stroke && computed.stroke !== 'none') {
            cln.setAttribute('stroke', computed.stroke);
          }
          if (computed.strokeWidth) {
            cln.setAttribute('stroke-width', computed.strokeWidth);
          }
          if (computed.opacity) {
            cln.setAttribute('opacity', computed.opacity);
          }
        }
      }

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; 
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = 'rgba(15, 23, 42, 1)'; 
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          context.scale(scale, scale);
          context.drawImage(image, 0, 0, width, height);
          
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = `${chartName.toLowerCase().replace(/\s+/g, '_')}_export.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URLObj.revokeObjectURL(blobURL);
      };
      
      image.onerror = () => {
        const downloadLink = document.createElement('a');
        downloadLink.href = blobURL;
        downloadLink.download = `${chartName.toLowerCase().replace(/\s+/g, '_')}_export.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };

      image.src = blobURL;
    } catch (err) {
      console.error('Failed to export chart', err);
      alert('Failed to export chart.');
    }
  };

  const renderIndividualView = () => (
    <>
      <div className="chart-grid large-first">
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Goal Achievement Trend</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'Goal Achievement Trend')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%'}}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis domain={[0, 120]} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: '8px'}} />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Planned Trajectory" />
                <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} name="Actual Achieved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Weighted Score</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'Weighted Score')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%', position: 'relative'}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={goalScoreData} dataKey="score" innerRadius={80} outerRadius={110} paddingAngle={5}>
                  {goalScoreData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', textAlign:'center'}}>
              <div style={{fontSize:'2.5rem', fontWeight:800, color:'#4f46e5'}}>74%</div>
              <div style={{fontSize:'0.875rem', color:'var(--text-muted)'}}>Overall</div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Goal Score Breakdown</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'Goal Score Breakdown')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%'}}>
            <ResponsiveContainer>
              <BarChart data={goalScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis domain={[0, 150]} stroke="var(--text-muted)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Score %" radius={[4, 4, 0, 0]}>
                  {goalScoreData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>QoQ Comparison (Prev FY vs Current)</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'QoQ Comparison')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%'}}>
            <ResponsiveContainer>
              <BarChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis domain={[0, 120]} stroke="var(--text-muted)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="previous" fill="#9ca3af" name="Prev FY" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#10b981" name="Current FY" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderTeamView = () => (
    <>
      <div className="chart-grid large-first">
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Team Heatmap (Goals vs Members)</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'Team Heatmap')}>Export PNG</button>
          </div>
          <div className="heatmap-grid">
            {teamHeatmapData.map(row => (
              <div className="heatmap-row" key={row.name}>
                <div className="heatmap-label">{row.name}</div>
                {row.scores.map((score, i) => (
                  <div 
                    key={i} 
                    className="heatmap-cell" 
                    style={{backgroundColor: getHeatmapColor(score)}}
                    title={`${row.name} - Goal ${i+1}: ${score}%`}
                    onClick={() => alert(`Opening detail for ${row.name}`)}
                  >
                    {score}%
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem', fontSize:'0.75rem', color:'var(--text-muted)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.25rem'}}><div style={{width:12, height:12, background:'rgba(16, 185, 129, 1)'}}></div> &ge;100%</div>
            <div style={{display:'flex', alignItems:'center', gap:'0.25rem'}}><div style={{width:12, height:12, background:'rgba(16, 185, 129, 0.6)'}}></div> 80-99%</div>
            <div style={{display:'flex', alignItems:'center', gap:'0.25rem'}}><div style={{width:12, height:12, background:'rgba(245, 158, 11, 0.8)'}}></div> 50-79%</div>
            <div style={{display:'flex', alignItems:'center', gap:'0.25rem'}}><div style={{width:12, height:12, background:'rgba(239, 68, 68, 0.8)'}}></div> &lt;50%</div>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Manager Effectiveness</h3>
          </div>
          <div className="stats-panel">
            <div className="stat-item">
              <span className="label">Check-in Completion</span>
              <span className="val" style={{color:'#10b981'}}>100% <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>(Top 10%)</span></span>
            </div>
            <div className="stat-item">
              <span className="label">Avg Time to Approve</span>
              <span className="val">2.4 days</span>
            </div>
            <div className="stat-item">
              <span className="label">Team Avg Score</span>
              <span className="val">84% <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>vs Dept 76%</span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="chart-panel" style={{marginTop:'1.5rem'}}>
        <div className="chart-panel-header">
          <h3>Individual Trajectories (Sparklines)</h3>
        </div>
        <div className="spark-grid">
          {teamHeatmapData.map(row => (
            <div className="spark-card" key={row.name}>
              <div style={{fontWeight:600, marginBottom:'0.5rem'}}>{row.name}</div>
              <div style={{height: 60, width: '100%'}}>
                <ResponsiveContainer>
                  <LineChart data={[{v:70},{v:75},{v:85},{v:90}]}>
                    <Line type="monotone" dataKey="v" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderOrgView = () => (
    <>
      <div className="chart-grid">
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Thrust Area Distribution</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'Thrust Area Distribution')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%'}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={thrustAreaData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                  {thrustAreaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>UoM Distribution</h3>
            <button className="export-btn" onClick={(e) => handleExport(e, 'UoM Distribution')}>Export PNG</button>
          </div>
          <div style={{height: 300, width: '100%'}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={uomData} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {uomData.map((entry, index) => <Cell key={`cell-${index}`} fill={UOM_COLORS[index % UOM_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-panel" style={{marginTop:'1.5rem'}}>
        <div className="chart-panel-header">
          <h3>Manager Effectiveness Leaderboard</h3>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table className="leaderboard">
            <thead>
              <tr>
                <th>Manager Name ↕</th>
                <th>Approval Speed (Avg Days) ↕</th>
                <th>Team Check-in Rate ↕</th>
                <th>Team Avg Score ↕</th>
                <th># Escalations ↕</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Sarah Connor</td><td>1.2</td><td>100%</td><td>92%</td><td>0</td></tr>
              <tr><td>John Smith</td><td>3.5</td><td>85%</td><td>78%</td><td>2</td></tr>
              <tr><td>Alice Doe</td><td>2.1</td><td>90%</td><td>84%</td><td>0</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

   const renderCascadeView = () => {
    if (cascadeData.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <Award size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>No corporate Shared Goals have been cascade-pushed by Admin yet.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--primary)', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>⭐ Alignment Cascade Architecture</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            This interactive map shows how top-level corporate Shared Goals set by executives trickle down and direct key individual results across your organization. Select any node to trace the line-of-sight alignment.
          </p>
        </div>

        {cascadeData.map(node => (
          <div key={node.id} className="cascade-group" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.8fr',
            gap: '3rem',
            alignItems: 'center',
            position: 'relative',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            {/* Corporate Shared Goal Node */}
            <div className="glass-card corporate-node" style={{
              border: '2px solid var(--primary)',
              borderRadius: '12px',
              padding: '1.5rem',
              background: 'rgba(99, 102, 241, 0.08)',
              position: 'relative',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)'
            }}>
              <span style={{
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: '20px',
                position: 'absolute',
                top: '-12px',
                left: '15px',
                textTransform: 'uppercase'
              }}>
                Corporate Target
              </span>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>{node.title}</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{node.thrustArea} goal</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>🎯 Target: <strong>{node.target}</strong></span>
                <span>📈 Progress: <strong>{node.latestAchievement || 0}%</strong></span>
              </div>
            </div>

            {/* Individual Employee Mapped Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              {/* Connector line overlay */}
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '15px',
                bottom: '15px',
                width: '2px',
                background: 'var(--border)'
              }} />

              {node.children.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  No employees mapped to this goal yet. Mapped automatically when a goalsheet referencing this Shared Goal is approved.
                </div>
              ) : (
                node.children.map(child => (
                  <div key={child.id} className="glass-card employee-node" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    position: 'relative'
                  }}>
                    {/* Visual branch connector */}
                    <div style={{
                      position: 'absolute',
                      left: '-2.5rem',
                      top: '50%',
                      width: '2.5rem',
                      height: '2px',
                      background: 'var(--border)'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--success)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {child.employee?.name ? child.employee.name[0] : 'E'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{child.employee?.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{child.employee?.designation} ({child.employee?.department})</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{child.weightage}% weight</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contribution</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
          <select className="time-selector">
            <option>This Cycle (FY 2025-26)</option>
            <option>All Time</option>
          </select>
          <div className="role-tabs">
            <button className={`role-tab ${roleView === 'EMPLOYEE' ? 'active' : ''}`} onClick={() => setRoleView('EMPLOYEE')}>Individual</button>
            <button className={`role-tab ${roleView === 'MANAGER' ? 'active' : ''}`} onClick={() => setRoleView('MANAGER')}>Team</button>
            <button className={`role-tab ${roleView === 'ADMIN' ? 'active' : ''}`} onClick={() => setRoleView('ADMIN')}>Organization</button>
            <button className={`role-tab ${roleView === 'CASCADE' ? 'active' : ''}`} onClick={() => setRoleView('CASCADE')}>Alignment Cascade</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="chart-grid">
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
        </div>
      ) : (
        <>
          {roleView === 'EMPLOYEE' && renderIndividualView()}
          {roleView === 'MANAGER' && renderTeamView()}
          {roleView === 'ADMIN' && renderOrgView()}
          {roleView === 'CASCADE' && renderCascadeView()}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
