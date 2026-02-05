import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Modern Icons
const DashboardIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ProjectsIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const MembersIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const TasksIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const SettingsIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24"></path>
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine user role - assuming role_id: 1=admin, 2=team_leader, 3=team_member
  const isAdmin = user?.role_id === 1;
  const isLeader = user?.role_id === 2;
  const isMember = user?.role_id === 3;

  // Build menu based on role
  let menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  ];

  if (isMember || isLeader) {
  menuItems.push({ path: '/projects', label: 'Projects', icon: ProjectsIcon });
  }
  // Leaders and admins can manage members
  if (isAdmin || isLeader) {
    menuItems.push({ path: '/members', label: 'Members', icon: MembersIcon });
  }

  // Members see their assigned tasks
  if (isMember) {
    menuItems.push({ path: '/tasks', label: 'Tasks', icon: TasksIcon });
  }

  // Projects available to all

  menuItems.push({ path: '/settings', label: 'Settings', icon: SettingsIcon });

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>≡ TaskER</h3>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="sidebar-icon"><IconComponent /></span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
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
