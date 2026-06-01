import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavIcon = ({ d }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Sidebar = () => {
  const { user, logout, isAdmin, isReleaseManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!user?.roles) return '';
    if (user.roles.includes('ROLE_ADMIN')) return 'Admin';
    if (user.roles.includes('ROLE_RELEASE_MANAGER')) return 'Release Manager';
    return 'Developer';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">EDRA</div>
        <div className="sidebar-logo-sub">DevSecOps Platform</div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Main</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
          <span>Dashboard</span>
        </NavLink>

        <span className="sidebar-section-title">Deployments</span>

        <NavLink to="/deployments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <span>Deployments</span>
        </NavLink>

        <NavLink to="/risk-analysis" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
          <span>Risk Analysis</span>
        </NavLink>

        <NavLink to="/dependencies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" />
          <span>Dependencies</span>
        </NavLink>

        <NavLink to="/rollback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          <span>Rollback</span>
        </NavLink>

        {(isAdmin() || isReleaseManager()) && (
          <>
            <span className="sidebar-section-title">Management</span>
            <NavLink to="/approvals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <NavIcon d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              <span>Approvals</span>
            </NavLink>
          </>
        )}

        <span className="sidebar-section-title">Intelligence</span>

        <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M18 20V10 M12 20V4 M6 20v-6" />
          <span>Analytics</span>
        </NavLink>

        <NavLink to="/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <NavIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
          <span>Audit Logs</span>
        </NavLink>

        {isAdmin() && (
          <>
            <span className="sidebar-section-title">Admin</span>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <NavIcon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0" />
              <span>Users</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.fullName)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName || user?.username}</div>
            <div className="sidebar-user-role">{getRoleBadge()}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            title="Logout"
            style={{ padding: '0.35rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
