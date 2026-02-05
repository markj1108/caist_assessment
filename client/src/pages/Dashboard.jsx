import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskList from '../components/TaskList';

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: '2.5rem', color: '#0b5fff', fontWeight: 'bold' }}>
            {stats.totalProjects}
          </div>
          <div style={{ marginTop: 8, color: '#666' }}>Total Projects</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: '2.5rem', color: '#28a745', fontWeight: 'bold' }}>
            {stats.completedProjects}
          </div>
          <div style={{ marginTop: 8, color: '#666' }}>Completed Projects</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: '2.5rem', color: '#ff6b6b', fontWeight: 'bold' }}>
            {stats.overdueProjects}
          </div>
          <div style={{ marginTop: 8, color: '#666' }}>Overdue Projects</div>
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

      <div>
        <h3>Current Projects ({projects.filter(p => p.status !== 'completed').length})</h3>
        <div>
          {projects.filter(p => p.status !== 'completed').map(p => (
            <div key={p.id} className="list-item">
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="small">{p.description || 'No description'}</div>
                {p.due_date && (
                  <div className="small" style={{ marginTop: 4, color: new Date(p.due_date) < new Date() && p.status !== 'completed' ? '#ff6b6b' : '#666' }}>
                    Due: {new Date(p.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}