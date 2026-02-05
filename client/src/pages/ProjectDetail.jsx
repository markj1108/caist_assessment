import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [],
    priority: 'medium',
  });

  const isLeader = user?.role_id === 2;
  const isAdmin = user?.role_id === 1;
  const canAddTask = isLeader || isAdmin;

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
    try {
      console.log('Loading project ID:', projectId);
      const projectData = await api.get(`/projects/${projectId}`);
      console.log('Project data returned:', projectData);
      setProject(projectData);
      
      // Load tasks for this project - correct path
      try {
        const tasksData = await api.get(`/tasks/projects/${projectId}/tasks`);
        console.log('Tasks data returned:', tasksData);
        setTasks(tasksData || []);
      } catch (taskErr) {
        console.warn('Could not load tasks:', taskErr);
        setTasks([]);
      }

      // Load team members
      try {
        const membersData = isLeader
          ? await api.get('/users/team/members')
          : await api.get('/users');
        console.log('Members data returned:', membersData);
        setTeamMembers(membersData || []);
      } catch (memberErr) {
        console.warn('Could not load members:', memberErr);
        setTeamMembers([]);
      }
    } catch (err) {
      console.error('Error loading project data:', err);
      console.error('Error details:', err.response || err.message);
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

  function handleMemberToggle(memberId) {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter(id => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      // Create task for each selected assignee, or unassigned if none selected
      if (formData.assignees.length === 0) {
        const newTask = await api.post(`/tasks/projects/${projectId}/tasks`, {
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assignee_id: null,
        });
        setTasks([newTask, ...tasks]);
      } else {
        // Create task for each assignee
        const newTasks = await Promise.all(
          formData.assignees.map(assigneeId =>
            api.post(`/tasks/projects/${projectId}/tasks`, {
              title: formData.title,
              description: formData.description || null,
              priority: formData.priority,
              assignee_id: assigneeId,
            })
          )
        );
        setTasks([...newTasks, ...tasks]);
      }

      setFormData({
        title: '',
        description: '',
        assignees: [],
        priority: 'medium',
      });
      setShowForm(false);
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to create task');
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b5fff', fontSize: '1rem', marginBottom: 16 }}>← Back to Projects</button>
      <div style={{ background: '#ffe6e6', color: '#c41e3a', padding: 16, borderRadius: 4, marginBottom: 16 }}>
        <strong>Error:</strong> {error}
      </div>
    </div>
  );
  if (!project) return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b5fff', fontSize: '1rem', marginBottom: 16 }}>← Back to Projects</button>
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
              color: '#0b5fff',
              fontSize: '1rem',
              marginBottom: 8,
            }}
          >
            ← Back to Projects
          </button>
          <h1 style={{ marginTop: 0 }}>{project.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canAddTask && project.status !== 'completed' && (
            <button
              className="btn"
              onClick={() => setShowForm(!showForm)}
              style={{ background: '#0b5fff', color: 'white', padding: '8px 16px', marginLeft: 0 }}
            >
              {showForm ? 'Cancel' : '+ Add Task'}
            </button>
          )}
          {canAddTask && project.status !== 'completed' && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                  try {
                    await api.del(`/projects/${projectId}`);
                    alert('Project deleted successfully');
                    navigate('/projects');
                  } catch (err) {
                    setError(err.body?.error || err.message || 'Failed to delete project');
                  }
                }
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
          <h3 style={{ marginTop: 0 }}>Description</h3>
          <p>{project.description}</p>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.9rem', color: '#888' }}>
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
          <h3 style={{ marginTop: 0 }}>Progress</h3>
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
                  alert('Project marked as completed!');
                } catch (err) {
                  alert(err.body?.error || err.message || 'Failed to complete project');
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
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Create New Task</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Task Title *</label>
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
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Assign to Members (select multiple)
              </label>
              <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
                {teamMembers.length === 0 ? (
                  <div className="small">No team members available</div>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={formData.assignees.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        style={{ marginRight: 8, cursor: 'pointer' }}
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        style={{ cursor: 'pointer', flex: 1 }}
                      >
                        {member.name} ({member.email})
                      </label>
                    </div>
                  ))
                )}
              </div>
              <div className="small" style={{ marginTop: 4, color: '#666' }}>
                {formData.assignees.length === 0
                  ? 'No members selected (task will be unassigned)'
                  : `${formData.assignees.length} member(s) selected`}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                className="btn"
                style={{ background: '#28a745', color: 'white', padding: '8px 16px', marginLeft: 0 }}
              >
                Create Task
              </button>
            </div>
          </form>
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
                    <span className="small">Status: {task.status_name || 'todo'}</span>
                    {task.assignee_name && (
                      <span className="small">Assigned: {task.assignee_name}</span>
                    )}
                  </div>
                </div>
                {canAddTask && project.status !== 'completed' && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        try {
                          await api.del(`/tasks/${task.id}`);
                          setTasks(tasks.filter(t => t.id !== task.id));
                        } catch (err) {
                          setError(err.body?.error || err.message || 'Failed to delete task');
                        }
                      }
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
