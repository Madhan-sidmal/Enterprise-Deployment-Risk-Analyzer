import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import deploymentService from '../services/deployment.service';

const StatCard = ({ icon, label, value, change, changeType, iconBg, iconColor, delay }) => (
  <div className="stat-card animate-fade-in-up" style={{ animationDelay: delay }}>
    <div className="stat-card-header">
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor, fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All time</span>
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    {change && (
      <div className="stat-card-change" style={{ color: changeType === 'up' ? 'var(--success)' : 'var(--danger)' }}>
        {changeType === 'up' ? '↑' : '↓'} {change}
      </div>
    )}
  </div>
);

const QuickAction = ({ icon, title, description, onClick, gradient }) => (
  <button onClick={onClick} style={{
    background: 'var(--gradient-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    width: '100%',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 'var(--radius-md)',
      background: gradient, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>{title}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{description}</div>
    </div>
  </button>
);

const Dashboard = () => {
  const { user, isAdmin, isReleaseManager } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, approved: 0, pendingReview: 0, deployed: 0 });

  useEffect(() => {
    deploymentService.getStats()
      .then(setStats)
      .catch(() => {}); // silently ignore if backend not running
  }, []);

  const getRoleDisplay = () => {
    if (!user?.roles) return 'Developer';
    if (user.roles.includes('ROLE_ADMIN')) return 'Administrator';
    if (user.roles.includes('ROLE_RELEASE_MANAGER')) return 'Release Manager';
    return 'Developer';
  };

  const getRoleBadgeClass = () => {
    if (!user?.roles) return 'badge-developer';
    if (user.roles.includes('ROLE_ADMIN')) return 'badge-admin';
    if (user.roles.includes('ROLE_RELEASE_MANAGER')) return 'badge-release-manager';
    return 'badge-developer';
  };

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 className="welcome-title">
                Welcome back, <span>{user?.fullName?.split(' ')[0] || user?.username}</span> 👋
              </h1>
              <span className={`badge ${getRoleBadgeClass()}`}>{getRoleDisplay()}</span>
            </div>
            <p className="welcome-subtitle">
              Here's what's happening with your deployments today. Stay ahead of risks.
            </p>
          </div>
          <div style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            System Operational
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children">
        <StatCard
          icon="🚀" label="Total Deployments" value={stats.total}
          iconBg="rgba(99,102,241,0.15)" iconColor="#818cf8"
          delay="0.05s"
        />
        <StatCard
          icon="🟡" label="Pending Review" value={stats.pendingReview}
          iconBg="rgba(245,158,11,0.15)" iconColor="#fbbf24"
          delay="0.1s"
        />
        <StatCard
          icon="✅" label="Approved" value={stats.approved}
          iconBg="rgba(16,185,129,0.15)" iconColor="#34d399"
          delay="0.15s"
        />
        <StatCard
          icon="🚢" label="Deployed" value={stats.deployed}
          iconBg="rgba(6,182,212,0.15)" iconColor="#22d3ee"
          delay="0.2s"
        />
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Quick Actions */}
        <div>
          <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Actions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Common tasks for your role</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <QuickAction
              icon="📦" title="New Deployment"
              description="Create and submit a new deployment package"
              gradient="rgba(99,102,241,0.2)"
              onClick={() => navigate('/deployments/new')}
            />
            <QuickAction
              icon="📋" title="All Deployments"
              description="View and manage all your deployment packages"
              gradient="rgba(6,182,212,0.2)"
              onClick={() => navigate('/deployments')}
            />
            <QuickAction
              icon="🔍" title="Risk Analysis"
              description="Run risk scoring on pending deployments (Phase 3)"
              gradient="rgba(239,68,68,0.2)"
              onClick={() => navigate('/risk-analysis')}
            />
            {(isAdmin() || isReleaseManager()) && (
              <QuickAction
                icon="✅" title="Approval Queue"
                description="Review and approve pending deployments (Phase 6)"
                gradient="rgba(16,185,129,0.2)"
                onClick={() => navigate('/approvals')}
              />
            )}
          </div>
        </div>

        {/* System Info */}
        <div>
          <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>System Status</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Current platform health</p>
          </div>

          <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
          }}>
            {[
              { name: 'API Gateway', status: 'Operational', color: 'var(--success)' },
              { name: 'PostgreSQL Database', status: 'Operational', color: 'var(--success)' },
              { name: 'Risk Engine', status: 'Coming in Phase 3', color: 'var(--warning)' },
              { name: 'CI/CD Pipeline', status: 'Coming in Phase 10', color: 'var(--warning)' },
              { name: 'Notification Service', status: 'Coming in Bonus', color: 'var(--text-muted)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '0.75rem', color: item.color }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Info Card */}
          <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            marginTop: 'var(--space-4)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              Your Account
            </div>
            {[
              { label: 'Username', value: user?.username },
              { label: 'Email', value: user?.email },
              { label: 'Role', value: getRoleDisplay() },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div style={{
        marginTop: 'var(--space-8)',
        background: 'var(--gradient-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
          🗺️ Project Roadmap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)' }}>
          {[
            { phase: 1, name: 'Foundation', status: 'done' },
            { phase: 2, name: 'Deployments', status: 'done' },
            { phase: 3, name: 'Risk Engine', status: 'done' },
            { phase: 4, name: 'Dependencies', status: 'done' },
            { phase: 5, name: 'Rollback', status: 'next' },
          ].map(p => (
            <div key={p.phase} style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${p.status === 'done' ? 'rgba(16,185,129,0.3)' : p.status === 'next' ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
              background: p.status === 'done' ? 'rgba(16,185,129,0.08)' : p.status === 'next' ? 'rgba(99,102,241,0.08)' : 'transparent',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>
                {p.status === 'done' ? '✅' : p.status === 'next' ? '🔜' : '⏳'}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Phase {p.phase}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
