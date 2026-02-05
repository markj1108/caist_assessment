import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine user role - assuming role_id: 1=admin, 2=team_leader, 3=team_member
  const isAdmin = user?.role_id === 1;
  const isLeader = user?.role_id === 2;
  const isMember = user?.role_id === 3;

  // Build menu based on role
  let menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  if (isMember || isLeader) {
  menuItems.push({ path: '/projects', label: 'Projects', icon: '📁' });
  }
  // Leaders and admins can manage members
  if (isAdmin || isLeader) {
    menuItems.push({ path: '/members', label: 'Members', icon: '👥' });
  }

  // Members see their assigned tasks
  if (isMember) {
    menuItems.push({ path: '/tasks', label: 'Tasks', icon: '✓' });
  }

  // Projects available to all

  menuItems.push({ path: '/settings', label: 'Settings', icon: '⚙️' });

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>☰ TaskER</h3>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="small">{user?.name}</div>
          <div className="small" style={{ color: '#666' }}>{user?.email}</div>
        </div>
        <button onClick={logout} className="btn" style={{ width: '100%', marginTop: 8 }}>
          Logout
        </button>
      </div>
    </aside>
  );
}
