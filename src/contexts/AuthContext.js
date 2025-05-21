import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    localStorage.setItem('token', res.data.access_token);
    const me = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${res.data.access_token}` }
    });
    setUser(me.data);
  };

  const signup = async (username, password) => {
    await axios.post(`${API_URL}/auth/signup`, { username, password });
    return login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);