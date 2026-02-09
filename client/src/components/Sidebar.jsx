import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Modern feather-style icons
const DashboardIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
  </svg>
);

const ProjectsIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const MembersIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const TasksIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"></path>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

function getRoleName(roleId) {
  if (roleId === 1) return 'Admin';
  if (roleId === 2) return 'Team Leader';
  return 'Team Member';
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role_id === 1;
  const isLeader = user?.role_id === 2;
  const isMember = user?.role_id === 3;

  let menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  ];

  if (isMember || isLeader) {
    menuItems.push({ path: '/projects', label: 'Projects', icon: ProjectsIcon });
  }
  if (isLeader) {
    menuItems.push({ path: '/members', label: 'Members', icon: MembersIcon });
  }
  if (isAdmin) {
    menuItems.push({ path: '/members', label: 'Users', icon: MembersIcon });
  }
  if (isMember) {
    menuItems.push({ path: '/tasks', label: 'Tasks', icon: TasksIcon });
  }
  menuItems.push({ path: '/settings', label: 'Settings', icon: SettingsIcon });

  const isActive = (path) => location.pathname === path;

  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'var(--primary)', color: 'white', width: 28, height: 28, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>≡</span>
          TaskER
        </h3>
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
        <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{getRoleName(user?.role_id)}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', marginTop: 8, padding: '9px 12px',
            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
            borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
        >
          <LogoutIcon /> Logout
        </button>
      </div>
    </aside>
  );
}
