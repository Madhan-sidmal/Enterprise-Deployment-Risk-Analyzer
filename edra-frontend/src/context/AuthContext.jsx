import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data);
    return data;
  };

  const register = async (registerData) => {
    return await authService.register(registerData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isAdmin = () => hasRole('ROLE_ADMIN');
  const isReleaseManager = () => hasRole('ROLE_RELEASE_MANAGER');
  const isDeveloper = () => hasRole('ROLE_DEVELOPER');

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, register,
      hasRole, isAdmin, isReleaseManager, isDeveloper
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
