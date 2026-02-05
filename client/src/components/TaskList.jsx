import React from 'react';
import { Link } from 'react-router-dom';

export default function TaskList({ tasks = [] }) {
  if (!tasks || tasks.length === 0) return <div className="small">No tasks</div>;
  return (
    <div>
      {tasks.map(t => (
        <div key={t.id} className="list-item">
          <div style={{ maxWidth: '70%' }}>
            <div style={{ fontWeight:600 }}>{t.title}</div>
            <div className="small">Project: {t.project_name || t.project_id} • Status: {t.status_name}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to={`/tasks/${t.id}`} className="btn">Open</Link>
          </div>
        </div>
      ))}
    </div>
  );
}