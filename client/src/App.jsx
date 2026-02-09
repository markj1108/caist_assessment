import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
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

  // Allow access if user is active (is_active is not false)
  // This allows both is_active === true and undefined/null for backward compatibility
  const isUserActive = user && user.is_active !== false;
  
  // If user is logged in but explicitly disabled, log them out immediately
  React.useEffect(() => {
    if (user && user.is_active === false) {
      logout();
    }
  }, [user, logout]);

  return (
    <div className="app">
      <div className="app-container">
        {isUserActive && <Sidebar />}
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