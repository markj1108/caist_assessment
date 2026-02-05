import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const navigate = useNavigate();

  useEffect(() => {
    // keep user in sync with localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  function saveToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
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

  function logout() {
    saveToken(null);
    setUser(null);
    navigate('/', { replace: true });
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