import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

// Map of status name -> id (update if your DB uses different ids)
const STATUS_OPTIONS = [
  { id: 1, name: 'To Do' },
  { id: 2, name: 'In Progress' },
  { id: 3, name: 'Review' },
  { id: 4, name: 'Blocked' },
  { id: 5, name: 'Done' },
];

export default function TaskDetail() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const [task, setTask] = useState(null); // we'll use assigned list's object or call projects tasks list first time
  const [statusLogs, setStatusLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // fetch status logs and comments. If we don't have full task payload, fetch tasks by assigned list endpoint and pick.
    Promise.all([
      api.get(`/tasks/${taskId}/status_logs`),
      api.get(`/tasks/${taskId}/comments`),
    ])
      .then(([logs, cmts]) => {
        setStatusLogs(logs || []);
        setComments(cmts || []);
      })
      .catch(e => setError(e.body?.error || e.message || 'Failed to load'));
    // Try to get the task detail by searching the assigned list and projects lists (fast), otherwise the backend could be extended with GET /tasks/:id
    api.get('/tasks/assigned').then(list => {
      const found = (list || []).find(t => String(t.id) === String(taskId));
      if (found) setTask(found);
    }).catch(()=>{});
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
      setStatusLogs(prev => (res.status_log ? [...prev, res.status_log] : prev));
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
      setComments(prev => [...prev, c]);
      setNewComment('');
    } catch (e) {
      setError(e.body?.error || e.message || 'Failed to add comment');
    }
  }

  return (
    <div>
      <button className="btn" onClick={() => nav(-1)}             style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#000000',
              fontSize: '2rem',
              marginBottom: 8,
            }}>←</button>
      <div className="card" style={{ marginTop:12 }}>
        <h2>{task ? task.title : `Task #${taskId}`}</h2>
        <div className="small" style={{ fontSize: '1.5rem', color: '#000000'}}>Project: {task?.project_name || task?.project_id || '—'}</div>
        <div style={{ marginTop:8, fontSize: '1.2rem', color: '#000000' }}>Description: {task?.description}</div>

        <hr />

        <h4 style={{ marginTop: 12}}>Status</h4>
        <div className="small" style={{ marginTop: 8, fontSize: '1rem', color: '#000000'}}>Current: {task?.status_name || (statusLogs[statusLogs.length-1]?.new_status_id)}</div>
        <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
          <select className="input" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ width:220 }}>
            <option value="">Select new status</option>
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="optional note" />
          <button className="btn" onClick={changeStatus} style={{backgroundColor: "#0b5fff", color: "white"}}>Change</button>
        </div>
        {error && <div style={{ color:'red', marginTop:8 }}>{error}</div>}

        <hr />

        <h4 style={{ marginTop: 12}}>Comments</h4>
        <div>
          {comments.map(c => (
            <div key={c.id} style={{ padding:8, borderBottom:'1px solid #eee' }}>
              <div style={{ fontWeight:600 }}>{c.author_name || c.author_id}</div>
              <div className="small">{new Date(c.created_at).toLocaleString()}</div>
              <div style={{ marginTop:6 }}>{c.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8 }}>
          <textarea className="input" rows={3} value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment" />
          <div style={{ textAlign:'right', marginTop:8 }}>
            <button className="btn" onClick={addComment} style={{backgroundColor: "#0b5fff", color: "white"}}>Post comment</button>
          </div>
        </div>

        <hr />

        <h4>Status history</h4>
        <div>
          {statusLogs.map(sl => (
            <div key={sl.id} style={{ padding:8, borderBottom:'1px solid #eee' }}>
              <div className="small">{sl.changed_by_name || sl.changed_by} — {new Date(sl.created_at).toLocaleString()}</div>
              <div style={{ fontWeight:600 }}>{sl.old_status || sl.old_status_id} → {sl.new_status || sl.new_status_id}</div>
              {sl.note && <div className="small" style={{ marginTop:6 }}>{sl.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}