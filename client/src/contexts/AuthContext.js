import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const navigate = useNavigate();

  function saveToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // keep user in sync with localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Periodically check if user account is still active
  useEffect(() => {
    if (!user) return;

    const checkUserStatus = async () => {
      try {
        const response = await api.get(`/users/${user.id}`);
        // Log out only if explicitly disabled (is_active === false)
        if (response && response.is_active === false) {
          logout();
        }
      } catch (err) {
        // If we can't fetch user status, don't do anything
      }
    };

    const interval = setInterval(checkUserStatus, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [user, logout]);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    

    if (data.user.is_active === false) {
      throw new Error('Your account has been disabled. Please contact an administrator.');
    }
    
    // backend returns { token, user }
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password, role = 'team_member') {
    const data = await api.post('/auth/register', { name, email, password, role });
    // backend returns { token, user }
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}