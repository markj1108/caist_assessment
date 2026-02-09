import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function formatStatus(name) {
  if (!name) return 'To Do';
  const map = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review', blocked: 'Blocked' };
  return map[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function TaskDetail() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const [task, setTask] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  function resolveStatusNameById(id) {
    const s = statusOptions.find(x => Number(x.id) === Number(id));
    return s ? s.name : undefined;
  }

  function augmentStatusLog(sl) {
    const copy = { ...sl };
    if (!copy.changed_by_name && user) copy.changed_by_name = user.name || user.email || String(user.id);
    if (!copy.old_status && copy.old_status_id) copy.old_status = resolveStatusNameById(copy.old_status_id);
    if (!copy.new_status && copy.new_status_id) copy.new_status = resolveStatusNameById(copy.new_status_id);
    return copy;
  }

  useEffect(() => {
    Promise.all([
      api.get(`/tasks/${taskId}`),
      api.get('/tasks/statuses'),
      api.get(`/tasks/${taskId}/status_logs`),
      api.get(`/tasks/${taskId}/comments`),
    ])
      .then(([taskData, statuses, logs, cmts]) => {
        setTask(taskData);
        setStatusOptions(statuses || []);
        // augment logs using the fetched `statuses` array (state update is async)
        const augmentedLogs = (logs || []).map(sl => {
          const copy = { ...sl };
          if (!copy.changed_by_name && user) copy.changed_by_name = user.name || user.email || String(user.id);
          if (!copy.old_status && copy.old_status_id) {
            const s = (statuses || []).find(x => Number(x.id) === Number(copy.old_status_id));
            if (s) copy.old_status = s.name;
          }
          if (!copy.new_status && copy.new_status_id) {
            const s = (statuses || []).find(x => Number(x.id) === Number(copy.new_status_id));
            if (s) copy.new_status = s.name;
          }
          return copy;
        });
        setStatusLogs(augmentedLogs);
        setComments((cmts || []).map(c => ({ ...c, author_name: c.author_name || (user ? (user.name || user.email || String(user.id)) : c.author_id) })));
      })
      .catch(e => setError(e.body?.error || e.message || 'Failed to load'));
  }, [taskId]);

  async function changeStatus() {
    setError('');
    if (!newStatus) {
      setError('Pick a status');
      return;
    }
    try {
      const res = await api.post(`/tasks/${taskId}/status`, { new_status_id: Number(newStatus), note });
      // res: { task, status_log }
      setTask(res.task);
      if (res.status_log) {
        const augmented = augmentStatusLog(res.status_log);
        setStatusLogs(prev => [...prev, augmented]);
      }
      setNote('');
      setNewStatus('');
    } catch (e) {
      setError(e.body?.error || e.message || 'Failed to change status');
    }
  }

  async function addComment() {
    if (!newComment) return;
    try {
      const c = await api.post(`/tasks/${taskId}/comments`, { body: newComment });
      // Ensure the UI shows the author's display name immediately without needing a full refresh
      const commentWithAuthor = {
        ...c,
        author_name: c.author_name || (user ? (user.name || user.email || String(user.id)) : c.author_id)
      };
      setComments(prev => [...prev, commentWithAuthor]);
      setNewComment('');
    } catch (e) {
      setError(e.body?.error || e.message || 'Failed to add comment');
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => nav(-1)} style={{ marginBottom: 8 }}>← Back</button>
      <div className="card" style={{ marginTop:12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{task ? task.title : `Task #${taskId}`}</h2>
            <div className="small" style={{ marginTop: 6, color: '#64748b' }}>Project: {task?.project_name || task?.project_id || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{task?.priority?.toUpperCase() || 'MED'}</div>
            <div style={{ marginTop: 6 }}><span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>{formatStatus(task?.status_name)}</span></div>
          </div>
        </div>
        {task?.description && <div style={{ marginTop:12, color: '#475569' }}>{task.description}</div>}

        <hr />

        <h4 style={{ marginTop: 12}}>Status</h4>
        <div className="small" style={{ marginTop: 8, fontSize: '1rem', color: '#000000'}}>Current: {formatStatus(task?.status_name) || (statusLogs[statusLogs.length-1]?.new_status_id)}</div>
        <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center', flexWrap: 'wrap' }}>
          <select className="input" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ minWidth:200 }}>
            <option value="">Select new status</option>
            {statusOptions.map(s => <option key={s.id} value={s.id}>{formatStatus(s.name)}</option>)}
          </select>
          <input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="optional note" />
          <button className="btn" onClick={changeStatus}>Change</button>
        </div>
        {error && <div style={{ color:'red', marginTop:8 }}>{error}</div>}

        <hr />

        <h4 style={{ marginTop: 12}}>Comments</h4>
        <div>
          {comments.map(c => (
            <div key={c.id} style={{ padding:12, borderRadius: 8, border: '1px solid #f1f5f9', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight:600 }}>{c.author_name || c.author_id}</div>
                <div className="small" style={{ color: '#94a3b8' }}>{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div style={{ marginTop:8 }}>{c.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8 }}>
          <textarea className="input" rows={3} value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment" />
          <div style={{ textAlign:'right', marginTop:8 }}>
            <button className="btn" onClick={addComment}>Post comment</button>
          </div>
        </div>

        <hr />

        <h4>Status history</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statusLogs.map(sl => (
            <div key={sl.id} style={{ padding:12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <div className="small" style={{ color: '#94a3b8' }}>{sl.changed_by_name || sl.changed_by} — {new Date(sl.created_at).toLocaleString()}</div>
              <div style={{ fontWeight:600, marginTop:6 }}>{formatStatus(sl.old_status) || sl.old_status_id} → {formatStatus(sl.new_status) || sl.new_status_id}</div>
              {sl.note && <div className="small" style={{ marginTop:6 }}>{sl.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}