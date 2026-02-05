import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        {canAddProject && (
          <button
            className="btn"
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#0b5fff', color: 'white', padding: '8px 16px', marginLeft: 0 }}
          >
            {showForm ? 'Cancel' : '+ Add Project'}
          </button>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12, padding: 12, background: '#ffe6e6', borderRadius: 4 }}>{error}</div>}

      {canAddProject && showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Create New Project</h3>
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

            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                className="btn"
                style={{ background: '#28a745', color: 'white', padding: '8px 16px', marginLeft: 0 }}
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {projects.length === 0 ? (
          <div className="small">No projects yet.</div>
        ) : (
          <div>
            {/* Current Projects Section */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ marginBottom: 16 }}>Current Projects ({projects.filter(p => p.status !== 'completed').length})</h3>
              {projects.filter(p => p.status !== 'completed').length === 0 ? (
                <div className="small" style={{ padding: 12, background: '#f0f4f8', borderRadius: 6 }}>No active projects.</div>
              ) : (
                <div>
                  {projects.filter(p => p.status !== 'completed').map(project => (
                    <div
                      key={project.id}
                      onClick={() => {
                        console.log('Clicking project with ID:', project.id, 'Full project:', project);
                        navigate(`/projects/${project.id}`);
                      }}
                      style={{
                        padding: 12,
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0b5fff' }}>
                        {project.name}
                      </div>
                      {project.description && (
                        <div style={{ marginTop: 4, color: '#666', fontSize: '0.95rem' }}>
                          {project.description}
                        </div>
                      )}
                      
                      {/* Progress bar */}
                      {project.total_tasks > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                            <span>Progress</span>
                            <span>{project.progress}% ({project.completed_tasks}/{project.total_tasks})</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${project.progress}%`,
                              background: '#28a745',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                        </div>
                      )}
                      
                      <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: '0.9rem', color: '#888' }}>
                        {project.start_date && (
                          <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                        )}
                        {project.due_date && (
                          <span style={{ color: new Date(project.due_date) < new Date() ? '#ff6b6b' : '#888' }}>
                            Due: {new Date(project.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span style={{ color: '#28a745' }}>
                          Active
                        </span>
                      </div>
                      {project.owner_name && (
                        <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#999' }}>
                          Owner: {project.owner_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Projects Section */}
            {projects.filter(p => p.status === 'completed').length > 0 && (
              <div style={{ paddingTop: 24, borderTop: '2px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: 16, color: '#64748b' }}>Completed Projects ({projects.filter(p => p.status === 'completed').length})</h3>
                <div>
                  {projects.filter(p => p.status === 'completed').map(project => (
                    <div
                      key={project.id}
                      onClick={() => {
                        console.log('Clicking project with ID:', project.id, 'Full project:', project);
                        navigate(`/projects/${project.id}`);
                      }}
                      style={{
                        padding: 12,
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        opacity: 0.7,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#64748b' }}>
                        {project.name} <span style={{ fontSize: '1rem' }}>✓</span>
                      </div>
                      {project.description && (
                        <div style={{ marginTop: 4, color: '#999', fontSize: '0.95rem' }}>
                          {project.description}
                        </div>
                      )}
                      
                      <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: '0.9rem', color: '#999' }}>
                        {project.start_date && (
                          <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                        )}
                        {project.due_date && (
                          <span>
                            Due: {new Date(project.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span style={{ color: '#999', fontWeight: 500 }}>
                          Completed
                        </span>
                      </div>
                      {project.owner_name && (
                        <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#bbb' }}>
                          Owner: {project.owner_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
