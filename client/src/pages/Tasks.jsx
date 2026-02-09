import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function formatStatus(name) {
  if (!name) return 'To Do';
  const map = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review', blocked: 'Blocked' };
  return map[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase();
  if (s === 'done') return { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' };
  if (s === 'in_progress') return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
  if (s === 'review') return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
  if (s === 'blocked') return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
  return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }; // todo / default
}

function getPriorityStyle(p) {
  if (p === 'high') return { bg: '#fee2e2', color: '#dc2626', icon: '🔴' };
  if (p === 'medium') return { bg: '#fef3c7', color: '#d97706', icon: '🟡' };
  return { bg: '#d1fae5', color: '#059669', icon: '🟢' };
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading tasks...</div>
    </div>
  );

  const activeTasks = tasks.filter(t => (t.status_name || '').toLowerCase() !== 'done');
  const doneTasks = tasks.filter(t => (t.status_name || '').toLowerCase() === 'done');

  const filteredTasks = filter === 'all'
    ? activeTasks
    : filter === 'done'
      ? doneTasks
      : activeTasks.filter(t => (t.status_name || '').toLowerCase() === filter);

  const statusCounts = {
    all: activeTasks.length,
    in_progress: activeTasks.filter(t => (t.status_name || '').toLowerCase() === 'in_progress').length,
    todo: activeTasks.filter(t => (t.status_name || '').toLowerCase() === 'todo' || !t.status_name).length,
    done: doneTasks.length,
  };

  const filters = [
    { key: 'all', label: 'Active', count: statusCounts.all },
    { key: 'todo', label: 'To Do', count: statusCounts.todo },
    { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
    { key: 'done', label: 'Completed', count: statusCounts.done },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0' }}>My Tasks</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, padding: 14, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: '0.95rem' }}>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: filter === f.key ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: filter === f.key ? 'var(--primary-bg)' : 'white',
              color: filter === f.key ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: filter === f.key ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {f.label}
              <span style={{
              background: filter === f.key ? 'var(--primary)' : 'var(--border-light)',
              color: filter === f.key ? 'white' : 'var(--text-secondary)',
              borderRadius: 10,
              padding: '1px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              minWidth: 22,
              textAlign: 'center',
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>No tasks found</div>
          <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
            {filter === 'all' ? 'No active tasks assigned to you yet.' : `No tasks with "${filters.find(f => f.key === filter)?.label}" status.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTasks.map(task => {
            const statusStyle = getStatusStyle(task.status_name);
            const priorityStyle = getPriorityStyle(task.priority);
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && (task.status_name || '').toLowerCase() !== 'done';

            return (
              <div
                key={task.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  padding: '20px 24px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onClick={() => window.location.href = `/tasks/${task.id}`}
              >
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: statusStyle.border,
                  borderRadius: '12px 0 0 12px',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{task.title}</h3>
                    </div>

                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: task.description ? 12 : 0 }}>
                      {/* Status badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}>
                        {formatStatus(task.status_name)}
                      </span>

                      {/* Priority badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: priorityStyle.bg,
                        color: priorityStyle.color,
                      }}>
                        {priorityStyle.icon} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>

                      {/* Project name */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                      }}>
                        📁 {task.project_name || task.project_id}
                      </span>

                      {/* Overdue badge */}
                      {isOverdue && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                        }}>
                          ⏰ Overdue
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {task.description.length > 120 ? task.description.substring(0, 120) + '...' : task.description}
                      </p>
                    )}
                  </div>

                  {/* Right side: due date + view button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                    {task.due_date && (
                      <div style={{
                        fontSize: '0.85rem',
                        color: isOverdue ? '#dc2626' : '#64748b',
                        fontWeight: isOverdue ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}>
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <Link
                      to={`/tasks/${task.id}`}
                      className="btn"
                      onClick={e => e.stopPropagation()}
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        padding: '8px 18px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
