import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/modal.css';

// Colors for project status indicators
const COLORS = ['var(--primary)', '#764ba2', '#ff6b6b', '#17a2b8', '#00bcd4', '#20c997'];

function getColorForProject(index) {
  return COLORS[index % COLORS.length];
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    due_date: '',
  });

  // ISO date string for today to use as min on date inputs
  const today = new Date().toISOString().split('T')[0];
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

  const isLeader = user?.role_id === 2;
  const isAdmin = user?.role_id === 1;
  const canAddProject = isLeader || isAdmin;

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.get('/projects');
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.body?.error || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const name = formData.name.trim();
    if (!name) {
      setAlert({ show: true, type: 'error', message: 'Project name is required' });
      return;
    }
    // allow only letters, numbers, spaces, hyphen and underscore
    const validName = /^[A-Za-z0-9\s\-_]+$/;
    if (!validName.test(name)) {
      setAlert({ show: true, type: 'error', message: 'Project name contains invalid characters. Use letters, numbers, spaces, - and _ only.' });
      return;
    }

    try {
      // Validate dates: do not allow past dates
      if (formData.start_date && formData.start_date < today) {
        setAlert({ show: true, type: 'error', message: 'Start date cannot be in the past' });
        return;
      }
      if (formData.due_date && formData.due_date < today) {
        setAlert({ show: true, type: 'error', message: 'Due date cannot be in the past' });
        return;
      }
      if (formData.start_date && formData.due_date && formData.start_date > formData.due_date) {
        setAlert({ show: true, type: 'error', message: 'Start date cannot be after due date' });
        return;
      }
      const newProject = await api.post('/projects', {
        name,
        description: formData.description || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
      });

      setProjects([newProject, ...projects]);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        due_date: '',
      });
      setShowForm(false);
      setAlert({ show: true, type: 'success', message: 'Project created successfully' });
      setTimeout(() => setAlert({ ...alert, show: false }), 2000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: err.body?.error || err.message || 'Failed to create project' });
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0' }}>Projects</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Manage and track your projects</p>
        </div>
        {canAddProject && (
          <button
            className="btn"
            onClick={() => setShowForm(!showForm)}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(11, 95, 255, 0.2)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(11, 95, 255, 0.3)';
              e.currentTarget.style.background = 'var(--primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 95, 255, 0.2)';
              e.currentTarget.style.background = 'var(--primary)';
            }}
          >
            + New Project
          </button>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12, padding: 12, background: '#ffe6e6', borderRadius: 4 }}>{error}</div>}

      {canAddProject && showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button 
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Project Name <span className="required-star">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
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
                placeholder="Enter project description"
                className="input"
                rows="4"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="input"
                    min={today}
                  />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="input"
                    min={today}
                  />
              </div>
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
                Create Project
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {projects.length === 0 ? (
          <div className="small">No projects yet.</div>
        ) : (
          <div>
            {/* Current Projects Section */}
            {projects.filter(p => p.status !== 'completed').length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 16, color: '#000000' }}>Current Projects ({projects.filter(p => p.status !== 'completed').length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {projects.filter(p => p.status !== 'completed').map((project, index) => (
                    <div
                      key={project.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 200,
                      }}
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectDetail(true);
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Header with color dot and menu */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getColorForProject(index),
                            flexShrink: 0,
                          }}
                        />
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.2rem',
                            color: '#cbd5e0',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Menu functionality can be added here
                          }}
                        >
                          ⋯
                        </button>
                      </div>

                      {/* Title */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: '0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>
                          {project.name}
                        </h4>
                        <span style={{ display: 'inline-block', backgroundColor: (project.due_date && new Date(project.due_date) < new Date()) ? '#ff6b6b' : 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {(project.due_date && new Date(project.due_date) < new Date()) ? 'Overdue' : 'Active'}
                        </span>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.9rem', flex: 1 }}>
                          {project.description.length > 100
                            ? project.description.substring(0, 100) + '...'
                            : project.description}
                        </p>
                      )}

                      {/* Progress Bar if tasks exist */}
                      {project.total_tasks > 0 && (
                        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${project.progress}%`,
                                background: getColorForProject(index),
                                transition: 'width 0.3s'
                              }} />
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {project.due_date && (
                          <div>
                            Due: {new Date(project.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Projects Section */}
            {projects.filter(p => p.status === 'completed').length > 0 && (
              <div style={{ paddingTop: 24, borderTop: '2px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: 16, color: '#000000' }}>Completed Projects ({projects.filter(p => p.status === 'completed').length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {projects.filter(p => p.status === 'completed').map((project, index) => (
                    <div
                      key={project.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 200,
                        opacity: 0.8,
                      }}
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectDetail(true);
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Header with color dot and menu */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#cbd5e0',
                            flexShrink: 0,
                          }}
                        />
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.2rem',
                            color: '#cbd5e0',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          ⋯
                        </button>
                      </div>

                      {/* Title */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <h4 style={{ margin: '0', color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>
                          {project.name}
                        </h4>
                        <span style={{ display: 'inline-block', backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Completed
                        </span>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.9rem', flex: 1 }}>
                          {project.description.length > 100
                            ? project.description.substring(0, 100) + '...'
                            : project.description}
                        </p>
                      )}

                      {/* Status */}
                      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {project.due_date && (
                          <div>
                            Due: {new Date(project.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProjectDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowProjectDetail(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {selectedProject.description && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Description</h3>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>{selectedProject.description}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {selectedProject.start_date && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Start Date</h3>
                    <p style={{ margin: 0, color: '#1e293b' }}>{new Date(selectedProject.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedProject.due_date && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Due Date</h3>
                    <p style={{ margin: 0, color: '#1e293b' }}>{new Date(selectedProject.due_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedProject.total_tasks > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Progress</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 8, color: '#64748b' }}>
                    <span>{selectedProject.completed_tasks || 0} / {selectedProject.total_tasks} tasks</span>
                    <span>{selectedProject.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${selectedProject.progress}%`,
                      background: getColorForProject(projects.indexOf(selectedProject)),
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                <button
                  className="btn"
                  onClick={() => setShowProjectDetail(false)}
                  style={{ background: '#6c757d', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setShowProjectDetail(false);
                    navigate(`/projects/${selectedProject.id}`);
                  }}
                  style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                >
                  View Details
                </button>
              </div>
            </div>
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
              <p style={{ fontSize: '1rem', color: alert.type === 'success' ? '#28a745' : '#c41e3a', marginBottom: 20 }}>
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


    </div>
  );
}
