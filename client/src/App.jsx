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
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <div className="app-container">
        {user && <Sidebar />}
        <main className="container">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/members"
              element={user ? <Members /> : <Navigate to="/" replace />}
            />
            <Route              path="/projects/:projectId"
              element={user ? <ProjectDetail /> : <Navigate to="/" replace />}
            />
            <Route              path="/tasks"
              element={user ? <Tasks /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects"
              element={user ? <Projects /> : <Navigate to="/" replace />}
            />
            <Route
              path="/tasks/:taskId"
              element={user ? <TaskDetail /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;