import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deployments from './pages/Deployments';
import CreateDeployment from './pages/CreateDeployment';
import DeploymentDetails from './pages/DeploymentDetails';
import RiskAnalysis from './pages/RiskAnalysis';
import Dependencies from './pages/Dependencies';
import Rollback from './pages/Rollback';
import Approvals from './pages/Approvals';
import AuditLogs from './pages/AuditLogs';
import Analytics from './pages/Analytics';
import { UsersPage } from './pages/ComingSoon';

// Layout wrapper with sidebar
const AppLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">
      <div className="topbar">
        <div className="topbar-title">Enterprise Deployment Risk Analyzer</div>
        <div className="topbar-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem', color: 'var(--success)'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            API Connected
          </div>
        </div>
      </div>
      <Outlet />
    </main>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/deployments/new" element={<CreateDeployment />} />
            <Route path="/deployments/:id" element={<DeploymentDetails />} />
            <Route path="/deployments/:id/edit" element={<CreateDeployment />} />
            <Route path="/risk-analysis" element={<RiskAnalysis />} />
            <Route path="/dependencies" element={<Dependencies />} />
            <Route path="/rollback" element={<Rollback />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
