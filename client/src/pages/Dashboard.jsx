import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskList from '../components/TaskList';

// Stat Icons - Larger icons for right side positioning
const ProjectsIcon = () => (
  <svg style={{ width: 60, height: 60, opacity: 1 }} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CompletedIcon = () => (
  <svg style={{ width: 60, height: 60, opacity: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const OverdueIcon = () => (
  <svg style={{ width: 60, height: 60, opacity: 1 }} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="2"></polyline>
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
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
          !isLeader ? api.get('/tasks/assigned') : Promise.resolve([]),
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: '1.5rem', fontWeight: 500, marginBottom: 12 }}>Total Projects</div>
              <div style={{ fontSize: '2.8rem', color: '#000000', fontWeight: 'bold', lineHeight: 1 }}>
                {stats.totalProjects}
              </div>
            </div>
            <div style={{ color: '#0b5fff', flexShrink: 0 }}>
              <ProjectsIcon />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: '1.5rem', fontWeight: 500, marginBottom: 12 }}>Completed Projects</div>
              <div style={{ fontSize: '2.8rem', color: '#000000', fontWeight: 'bold', lineHeight: 1 }}>
                {stats.completedProjects}
              </div>
            </div>
            <div style={{ color: '#28a745', flexShrink: 0 }}>
              <CompletedIcon />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: '1.5rem', fontWeight: 500, marginBottom: 12 }}>Overdue Projects</div>
              <div style={{ fontSize: '2.8rem', color: '#000000', fontWeight: 'bold', lineHeight: 1 }}>
                {stats.overdueProjects}
              </div>
            </div>
            <div style={{ color: '#ff0000', flexShrink: 0 }}>
              <OverdueIcon />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {!isLeader && (
          <>
            <h3>Your Assigned Tasks ({assignedTasks.filter(t => t.status_name !== 'done').length})</h3>
            <TaskList tasks={assignedTasks.filter(t => t.status_name !== 'done')} />
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>Projects Overview</h3>
        {projects.filter(p => p.status !== 'completed').length === 0 ? (
          <div className="small" style={{ color: '#666' }}>No active projects.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.filter(p => p.status !== 'completed').slice(0, 5).map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f0f4f8';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Project Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>
                    {p.name}
                  </h4>
                  {p.description && (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                      {p.description.length > 60
                        ? p.description.substring(0, 60) + '...'
                        : p.description}
                    </p>
                  )}
                </div>

                {/* Progress Section */}
                <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 120 }}>
                  {p.total_tasks > 0 ? (
                    <>
                      <div style={{ width: 100, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${p.progress}%`,
                            background: '#0b5fff',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                        {p.progress}%
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No tasks</span>
                  )}
                </div>
              </div>
            ))}
            {projects.filter(p => p.status !== 'completed').length > 5 && (
              <div style={{ textAlign: 'center', padding: 12, color: '#64748b', fontSize: '0.9rem' }}>
                +{projects.filter(p => p.status !== 'completed').length - 5} more projects
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}