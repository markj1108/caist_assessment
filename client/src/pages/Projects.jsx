import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/modal.css';

// Colors for project status indicators
const COLORS = ['#0b5fff', '#764ba2', '#ff6b6b', '#17a2b8', '#00bcd4', '#20c997'];

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    due_date: '',
  });

  const isLeader = user?.role_id === 2;
  const isAdmin = user?.role_id === 1;
  const canAddProject = isLeader || isAdmin;

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.get('/projects');
      console.log('Loaded projects:', data);
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

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      const newProject = await api.post('/projects', {
        name: formData.name,
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
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to create project');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Projects</h1>
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Project Name *</label>
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
                <h3 style={{ marginBottom: 16 }}>Current Projects ({projects.filter(p => p.status !== 'completed').length})</h3>
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
                      onClick={() => navigate(`/projects/${project.id}`)}
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
                      <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>
                        {project.name}
                      </h4>

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
                <h3 style={{ marginBottom: 16, color: '#64748b' }}>Completed Projects ({projects.filter(p => p.status === 'completed').length})</h3>
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
                      onClick={() => navigate(`/projects/${project.id}`)}
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
                      <h4 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>
                        {project.name} <span style={{ fontSize: '1rem' }}>✓</span>
                      </h4>

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

      {canAddProject && (
        <button
          className="btn"
          onClick={() => setShowForm(!showForm)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#0b5fff',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '50px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(11, 95, 255, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(11, 95, 255, 0.4)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(11, 95, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          + New Project
        </button>
      )}
    </div>
  );
}
