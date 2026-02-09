import React from 'react';
import { Link } from 'react-router-dom';

function formatStatus(name) {
  if (!name) return 'To Do';
  const map = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review', blocked: 'Blocked' };
  return map[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const statusColor = (name) => {
  const m = { todo: '#64748b', in_progress: '#d97706', done: '#059669', review: 'var(--primary)', blocked: '#dc2626' };
  return m[(name || '').toLowerCase()] || '#64748b';
};

export default function TaskList({ tasks = [] }) {
  if (!tasks || tasks.length === 0) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No tasks</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tasks.map(t => (
        <div key={t.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'white', borderRadius: 10,
          border: '1px solid #e2e8f0', transition: 'all 0.15s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,95,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{t.title}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.project_name || `Project #${t.project_id}`}</span>
              {(() => {
                const col = statusColor(t.status_name);
                const bg = (col && col.startsWith && col.startsWith('#')) ? (col + '14') : 'rgba(11,95,255,0.08)';
                return (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: bg, color: col,
                  }}>{formatStatus(t.status_name)}</span>
                );
              })()}
            </div>
          </div>
          <Link to={`/tasks/${t.id}`} className="btn btn-sm" style={{ flexShrink: 0, marginLeft: 12 }}>Open</Link>
        </div>
      ))}
    </div>
  );
}