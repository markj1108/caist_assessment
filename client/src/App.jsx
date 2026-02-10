import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './components/TaskDetail';
import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Allow access if user is active (is_active is not false)
  // This allows both is_active === true and undefined/null for backward compatibility
  const isUserActive = user && user.is_active !== false;
  
  // If user is logged in but explicitly disabled, log them out immediately
  useEffect(() => {
    if (user && user.is_active === false) {
      logout();
    }
  }, [user, logout]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      <div className="app-container">
        {isUserActive && (
          <button
            className="mobile-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}
        {isUserActive && (
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="container">
          <Routes>
            <Route path="/" element={isUserActive ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={isUserActive ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route
              path="/dashboard"
              element={isUserActive ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/members"
              element={isUserActive ? <Members /> : <Navigate to="/" replace />}
            />
            <Route              path="/projects/:projectId"
              element={isUserActive ? <ProjectDetail /> : <Navigate to="/" replace />}
            />
            <Route              path="/tasks"
              element={isUserActive ? <Tasks /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects"
              element={isUserActive ? <Projects /> : <Navigate to="/" replace />}
            />
            <Route
              path="/settings"
              element={isUserActive ? <Settings /> : <Navigate to="/" replace />}
            />
            <Route
              path="/tasks/:taskId"
              element={isUserActive ? <TaskDetail /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;