import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/modal.css';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTaskEdit, setShowTaskEdit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskEditData, setTaskEditData] = useState({});
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: '', action: null, title: '', message: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: null,
    priority: 'medium',
  });

  const isLeader = user?.role_id === 2;
  const isAdmin = user?.role_id === 1;
  const canAddTask = isLeader || isAdmin;

  function formatStatus(name) {
    if (!name) return 'To Do';
    const map = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review', blocked: 'Blocked' };
    return map[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
    try {
      const projectData = await api.get(`/projects/${projectId}`);
      setProject(projectData);
      
      // Load tasks for this project - correct path
      try {
        const tasksData = await api.get(`/tasks/projects/${projectId}/tasks`);
        setTasks(tasksData || []);
      } catch (taskErr) {
        setTasks([]);
      }

      // Load team members
      try {
        const membersData = isLeader
          ? await api.get('/users/team/members')
          : await api.get('/users');
        setTeamMembers(membersData || []);
      } catch (memberErr) {
        setTeamMembers([]);
      }
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  function openTaskEdit(task) {
    setSelectedTask(task);
    setTaskEditData({
      title: task.title,
      description: task.description || '',
      assignee_id: task.assignee_id,
      status_id: task.status_id,
      priority: task.priority,
    });
    setShowTaskEdit(true);
  }

  function handleTaskEditChange(e) {
    const { name, value } = e.target;
    setTaskEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  }



  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const title = formData.title.trim();
    if (!title) {
      setAlert({ show: true, type: 'error', message: 'Task title is required' });
      return;
    }
    const validTitle = /^[A-Za-z0-9\s\-_]+$/;
    if (!validTitle.test(title)) {
      setAlert({ show: true, type: 'error', message: 'Task title contains invalid characters. Use letters, numbers, spaces, - and _ only.' });
      return;
    }

    try {
      const newTask = await api.post(`/tasks/projects/${projectId}/tasks`, {
        title,
        description: formData.description || null,
        priority: formData.priority,
        assignee_id: formData.assignee_id ? parseInt(formData.assignee_id, 10) : null,
      });
      setTasks([newTask, ...tasks]);

      setFormData({
        title: '',
        description: '',
        assignee_id: null,
        priority: 'medium',
      });
      setShowForm(false);
      setAlert({ show: true, type: 'success', message: 'Task created successfully' });
      setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 2000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: err.body?.error || err.message || 'Failed to create task' });
    }
  }

  async function updateTask() {
    if (!selectedTask) return;

    const title = (taskEditData.title || '').trim();
    if (!title) {
      setAlert({ show: true, type: 'error', message: 'Task title is required' });
      return;
    }
    const validTitle = /^[A-Za-z0-9\s\-_]+$/;
    if (!validTitle.test(title)) {
      setAlert({ show: true, type: 'error', message: 'Task title contains invalid characters. Use letters, numbers, spaces, - and _ only.' });
      return;
    }
    
    try {
      const updatedTask = await api.put(`/tasks/${selectedTask.id}`, {
        title,
        description: taskEditData.description || null,
        assignee_id: taskEditData.assignee_id ? parseInt(taskEditData.assignee_id, 10) : null,
        priority: taskEditData.priority,
      });
      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
      setShowTaskEdit(false);
      setAlert({ show: true, type: 'success', message: 'Task updated successfully' });
      setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 2000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: err.body?.error || err.message || 'Failed to update task' });
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1rem', marginBottom: 16 }}>← Back to Projects</button>
      <div style={{ background: '#ffe6e6', color: '#c41e3a', padding: 16, borderRadius: 4, marginBottom: 16 }}>
        <strong>Error:</strong> {error}
      </div>
    </div>
  );
  if (!project) return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1rem', marginBottom: 16 }}>← Back to Projects</button>
      <div style={{ background: '#ffe6e6', color: '#c41e3a', padding: 16, borderRadius: 4, marginBottom: 16 }}>
        <strong>Error:</strong> Project not found (ID: {projectId})
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button
            onClick={() => navigate('/projects')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#000000',
              fontSize: '2rem',
              marginBottom: 8,
            }}
          >
            ← 
          </button>
          <h1 style={{ marginTop: 0 }}>{project.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canAddTask && project.status !== 'completed' && (
            <button
              className="btn"
              onClick={() => setShowForm(!showForm)}
              style={{ padding: '8px 16px', marginLeft: 0 }}
            >
              {showForm ? 'Cancel' : '+ Add Task'}
            </button>
          )}
          {canAddTask && project.status !== 'completed' && (
            <button
              onClick={() => {
                setConfirmDialog({
                  show: true,
                  type: 'delete',
                  action: 'deleteProject',
                  title: 'Delete Project',
                  message: 'Are you sure you want to delete this project? This action cannot be undone.'
                });
              }}
              style={{
                background: '#ff6b6b',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Delete Project
            </button>
          )}
        </div>
      </div>

      {project.description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Description</h2>
          <h3>{project.description}</h3>
          <div style={{ display: 'flex', gap: 50, fontSize: '0.9rem', color: '#000000' }}>
            {project.start_date && (
              <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
            )}
            {project.due_date && (
              <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {project.total_tasks > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Progress</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: 12 }}>
            <span><strong>{project.completed_tasks}</strong> of <strong>{project.total_tasks}</strong> tasks completed</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>{project.progress}%</span>
          </div>
          <div style={{ width: '100%', height: 12, background: '#e9ecef', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${project.progress}%`,
              background: '#28a745',
              transition: 'width 0.3s'
            }} />
          </div>
          {canAddTask && project.status !== 'completed' && (
            <button
              onClick={async () => {
                try {
                  await api.put(`/projects/${projectId}/complete`);
                  setProject(prev => ({ ...prev, status: 'completed' }));
                  setAlert({ show: true, type: 'success', message: 'Project marked as completed!' });
                } catch (err) {
                  setAlert({ show: true, type: 'error', message: err.body?.error || err.message || 'Failed to complete project' });
                }
              }}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Mark Project as Completed
            </button>
          )}
          {project.status === 'completed' && (
            <div style={{ marginTop: 16, padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4 }}>
              ✓ This project has been marked as completed
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginBottom: 12, padding: 12, background: '#ffe6e6', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {canAddTask && showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button 
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Task Title <span className="required-star">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                className="input"
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter task description"
                className="input"
                rows="3"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleInputChange} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Assign to Member</label>
              <select
                name="assignee_id"
                value={formData.assignee_id || ''}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowForm(false)}
                style={{ background: '#6c757d', color: 'white', padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                style={{ background: '#28a745', color: 'white', padding: '8px 16px' }}
              >
                Create Task
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <div className="small">No tasks yet.</div>
        ) : (
          <div>
            {tasks.map(task => (
              <div key={task.id} className="list-item" style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{task.title}</div>
                  {task.description && (
                    <div className="small" style={{ marginTop: 4, color: '#666' }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: task.priority === 'high' ? '#ff6b6b' : task.priority === 'medium' ? '#ffc107' : '#28a745',
                        color: 'white',
                      }}
                    >
                      {task.priority}
                    </span>
                    <span className="small">Status: {formatStatus(task.status_name)}</span>
                    {task.assignee_name && (
                      <span className="small">Assigned: {task.assignee_name}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {canAddTask && project.status !== 'completed' && (
                    <button
                      onClick={() => openTaskEdit(task)}
                      className="btn"
                      style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                  )}
                  {canAddTask && project.status !== 'completed' && (
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          show: true,
                          type: 'delete',
                          action: 'deleteTask',
                          title: 'Delete Task',
                          message: 'Are you sure you want to delete this task?',
                          taskId: task.id
                        });
                      }}
                      style={{
                        background: '#ff6b6b',
                        color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginLeft: 12,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Delete
                  </button>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Task View/Edit Modal */}
      {showTaskEdit && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{canAddTask ? 'Edit Task' : 'View Task'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowTaskEdit(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (canAddTask) updateTask(); }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskEditData.title || ''}
                  onChange={handleTaskEditChange}
                  disabled={!canAddTask}
                  className="input"
                  style={{ backgroundColor: !canAddTask ? '#f5f5f5' : 'white', cursor: !canAddTask ? 'not-allowed' : 'text' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Description</label>
                <textarea
                  name="description"
                  value={taskEditData.description || ''}
                  onChange={handleTaskEditChange}
                  disabled={!canAddTask}
                  className="input"
                  rows="4"
                  style={{ resize: 'vertical', backgroundColor: !canAddTask ? '#f5f5f5' : 'white', cursor: !canAddTask ? 'not-allowed' : 'text' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Priority</label>
                  <select
                    name="priority"
                    value={taskEditData.priority || 'medium'}
                    onChange={handleTaskEditChange}
                    disabled={!canAddTask}
                    className="input"
                    style={{ backgroundColor: !canAddTask ? '#f5f5f5' : 'white', cursor: !canAddTask ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Assign To</label>
                  <select
                    name="assignee_id"
                    value={taskEditData.assignee_id || ''}
                    onChange={handleTaskEditChange}
                    disabled={!canAddTask}
                    className="input"
                    style={{ backgroundColor: !canAddTask ? '#f5f5f5' : 'white', cursor: !canAddTask ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {canAddTask ? (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowTaskEdit(false)}
                      style={{ background: '#6c757d', color: 'white', padding: '8px 16px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px' }}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowTaskEdit(false)}
                    style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px' }}
                  >
                    Close
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {alert.show && (
        <div className="modal-overlay" onClick={() => setAlert({ ...alert, show: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{alert.type === 'success' ? '✓ Success' : '⚠ Error'}</h2>
              <button 
                className="modal-close"
                onClick={() => setAlert({ ...alert, show: false })}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: alert.type === 'success' ? '#28a745' : '#c41e3a', marginBottom: 20 }}>
                {alert.message}
              </p>
              <button
                onClick={() => setAlert({ ...alert, show: false })}
                className="btn"
                style={{ background: alert.type === 'success' ? '#28a745' : '#c41e3a', color: 'white', padding: '8px 24px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{confirmDialog.title}</h2>
              <button 
                className="modal-close"
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: 24 }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                  className="btn"
                  style={{ background: '#6c757d', color: 'white', padding: '8px 24px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (confirmDialog.action === 'deleteProject') {
                        await api.del(`/projects/${projectId}`);
                        setConfirmDialog({ ...confirmDialog, show: false });
                        setAlert({ show: true, type: 'success', message: 'Project deleted successfully' });
                        setTimeout(() => navigate('/projects'), 1500);
                      } else if (confirmDialog.action === 'deleteTask') {
                        await api.del(`/tasks/${confirmDialog.taskId}`);
                        setTasks(tasks.filter(t => t.id !== confirmDialog.taskId));
                        setConfirmDialog({ ...confirmDialog, show: false });
                        setAlert({ show: true, type: 'success', message: 'Task deleted successfully' });
                        setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 2000);
                      }
                    } catch (err) {
                      setConfirmDialog({ ...confirmDialog, show: false });
                      setAlert({ show: true, type: 'error', message: err.body?.error || err.message || 'Failed to delete' });
                      setTimeout(() => setAlert({ show: false, type: 'error', message: '' }), 3000);
                    }
                  }}
                  className="btn"
                  style={{ background: '#ff6b6b', color: 'white', padding: '8px 24px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
