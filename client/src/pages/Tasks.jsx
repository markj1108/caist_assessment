import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await api.get('/tasks/assigned');
      setTasks(data || []);
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Tasks</h1>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div className="card">
        {tasks.filter(t => t.status_name !== 'done').length === 0 ? (
          <div className="small">No tasks assigned to you yet.</div>
        ) : (
          <div>
            {tasks.filter(t => t.status_name !== 'done').map(task => (
              <div key={task.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{task.title}</div>
                  <div style={{ fontSize: '0.95rem', marginTop: 6, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#0b5fff', fontWeight: 500 }}>Project: {task.project_name || task.project_id}</span>
                    <span style={{ color: '#666', fontWeight: 500 }}>
                      Status: <strong style={{ color: task.status_name === 'done' ? '#28a745' : task.status_name === 'in_progress' ? '#0b5fff' : '#666' }}>
                        {task.status_name}
                      </strong>
                    </span>
                  </div>
                  {task.description && (
                    <div className="small" style={{ marginTop: 8, color: '#666' }}>
                      {task.description}
                    </div>
                  )}
                  {task.due_date && (
                    <div className="small" style={{ marginTop: 6 }}>
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      backgroundColor: task.priority === 'high' ? '#ff6b6b' : task.priority === 'medium' ? '#ffc107' : '#28a745',
                      color: 'white',
                    }}
                  >
                    {task.priority}
                  </span>
                  <Link to={`/tasks/${task.id}`} className="btn">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
