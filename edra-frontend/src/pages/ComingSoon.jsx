import React from 'react';

const ComingSoon = ({ phase, title, description, icon }) => (
  <div className="page-content">
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-xl)',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', marginBottom: 'var(--space-6)'
      }}>
        {icon}
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 'var(--space-4)' }}>
        {description}
      </p>
      <div style={{
        padding: '0.5rem 1rem',
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem',
        color: 'var(--primary-light)',
      }}>
        🚧 Coming in Phase {phase}
      </div>
    </div>
  </div>
);

export const DeploymentsPage = () => (
  <ComingSoon phase={2} title="Deployment Management" icon="📦"
    description="Create, track, and manage deployment packages with full lifecycle management." />
);

export const RiskAnalysisPage = () => (
  <ComingSoon phase={3} title="Risk Analysis Engine" icon="⚠️"
    description="AI-powered risk scoring engine to analyze deployment risks before production." />
);

export const DependenciesPage = () => (
  <ComingSoon phase={4} title="Dependency Analyzer" icon="🌐"
    description="Detect circular dependencies, version mismatches, and missing services." />
);

export const RollbackPage = () => (
  <ComingSoon phase={5} title="Rollback Simulator" icon="🔄"
    description="Simulate rollback scenarios and generate rollback strategies." />
);

export const ApprovalsPage = () => (
  <ComingSoon phase={6} title="Approval Workflow" icon="✅"
    description="Review and approve deployments as Release Manager or Admin." />
);

export const AuditLogsPage = () => (
  <ComingSoon phase={7} title="Audit Logs" icon="📋"
    description="Track all system actions with enterprise-grade audit logging." />
);

export const AnalyticsPage = () => (
  <ComingSoon phase={8} title="Analytics Dashboard" icon="📊"
    description="Executive analytics with deployment trends, risk distribution, and failure rates." />
);

export const UsersPage = () => (
  <ComingSoon phase={1} title="User Management" icon="👥"
    description="Admin panel for managing users and role assignments." />
);
