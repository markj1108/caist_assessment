import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskList from '../components/TaskList';
import { useNavigate } from 'react-router-dom';

// Modern stat icons (larger, friendly shapes)
const ProjectsIcon = () => (
  <svg style={{ width: 56, height: 56 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="14" rx="3" fill="currentColor" opacity="0.12" />
    <path d="M3.5 8.5h17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    <path d="M7 4h10l1 2H6l1-2z" fill="currentColor" opacity="0.95" />
    <rect x="6" y="11" width="5" height="3" rx="0.8" fill="currentColor" opacity="0.98" />
  </svg>
);

const CompletedIcon = () => (
  <svg style={{ width: 56, height: 56 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
    <path d="M7.5 12.5l2.5 2.5L16.5 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OverdueIcon = () => (
  <svg style={{ width: 56, height: 56 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
    <path d="M12 7v6l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="17.3" r="0.7" fill="currentColor" />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isLeader = user?.role_id === 2;

  useEffect(() => {
    async function load() {
      try {
        const [projects, tasks] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/assigned'),
        ]);
        setProjects(projects || []);
        setAssignedTasks(tasks || []);

        // Calculate statistics
        const now = new Date();
        const totalProjects = (projects || []).length;
        const completedProjects = (projects || []).filter(p => p.status === 'completed').length;
        const overdueProjects = (projects || []).filter(p => {
          return p.status !== 'completed' && p.due_date && new Date(p.due_date) < now;
        }).length;

        setStats({
          totalProjects,
          completedProjects,
          overdueProjects,
        });
      } catch (err) {
        setError(err.body?.error || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLeader]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#64748b' }}>Loading...</div>;

  const overdueProjects = projects.filter(p => p.status !== 'completed' && p.due_date && new Date(p.due_date) < new Date());
  const activeTasks = assignedTasks.filter(t => t.status_name !== 'done');
  const activeProjects = projects.filter(p => p.status !== 'completed');

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px 0' }}>Dashboard</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
      </div>
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects</div>
              <div style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: 700, lineHeight: 1 }}>{stats.totalProjects}</div>
            </div>
            <div style={{ color: 'var(--primary)', opacity: 0.8, flexShrink: 0 }}><ProjectsIcon /></div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
              <div style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: 700, lineHeight: 1 }}>{stats.completedProjects}</div>
            </div>
            <div style={{ color: '#059669', opacity: 0.8, flexShrink: 0 }}><CompletedIcon /></div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue</div>
              <div style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: 700, lineHeight: 1 }}>{stats.overdueProjects}</div>
            </div>
            <div style={{ color: '#dc2626', opacity: 0.8, flexShrink: 0 }}><OverdueIcon /></div>
          </div>
        </div>
      </div>

      {/* Overdue Projects Section */}
      {overdueProjects.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 12 }}>⚠ Overdue Projects</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {overdueProjects.map(p => (
              <div key={p.id} className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #dc2626', padding: '16px 20px' }} onClick={() => navigate(`/projects/${p.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                  <span className="badge badge-danger">Overdue</span>
                </div>
                {p.due_date && <div style={{ marginTop: 8, color: '#dc2626', fontSize: '0.85rem' }}>Due: {new Date(p.due_date).toLocaleDateString()}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Tasks */}
      {activeTasks.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 12 }}>Your Assigned Tasks ({activeTasks.length})</h3>
          <TaskList tasks={activeTasks} />
        </div>
      )}

      {/* Projects Overview */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>Projects Overview</h3>
        {activeProjects.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No active projects.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeProjects.slice(0, 5).map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 2px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</h4>
                  {p.description && (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                      {p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description}
                    </p>
                  )}
                </div>
                <div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 110 }}>
                  {p.total_tasks > 0 ? (
                    <>
                      <div style={{ width: 90, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--primary)', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{p.progress}%</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No tasks</span>
                  )}
                </div>
              </div>
            ))}
            {activeProjects.length > 5 && (
              <div style={{ textAlign: 'center', padding: 10, color: '#64748b', fontSize: '0.85rem' }}>
                +{activeProjects.length - 5} more projects
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}