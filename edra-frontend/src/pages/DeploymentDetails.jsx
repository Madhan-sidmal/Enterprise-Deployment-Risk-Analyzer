import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deploymentService from '../services/deployment.service';
import { useAuth } from '../context/AuthContext';
import '../styles/deployments.css';

const STATUS_LABELS = {
  DRAFT: 'Draft', PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved', REJECTED: 'Rejected', DEPLOYED: 'Deployed',
};

const ENV_ICONS = { DEVELOPMENT: '💻', STAGING: '🔬', UAT: '🧪', PRODUCTION: '🚀' };

const DetailField = ({ label, children }) => (
  <div className="detail-field">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{children}</div>
  </div>
);

const DeploymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dep, setDep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    deploymentService.getById(id)
      .then(setDep)
      .catch(() => setError('Deployment not found or access denied.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const updated = await deploymentService.submitForReview(id);
      setDep(updated);
    } catch (err) {
      alert(err?.response?.data?.message || 'Submit failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this deployment permanently?')) return;
    setActionLoading(true);
    try {
      await deploymentService.remove(id);
      navigate('/deployments');
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
      setActionLoading(false);
    }
  };

  const isOwner = dep && user && dep.createdByUsername === user.username;
  const isAdminOrRM = user?.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_RELEASE_MANAGER');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  // Estimate risk preview for Phase 3
  const getRiskPreview = () => {
    if (!dep) return { score: 0, label: 'Low', color: 'var(--success)' };
    let score = 0;
    if (dep.modifiedFilesCount > 20) score += 20;
    if (dep.environment === 'PRODUCTION') score += 25;
    if (dep.hasCriticalConfigChange) score += 30;
    if (dep.hasDependencyConflict) score += 15;
    if (dep.previousFailureCount > 0) score += 10;
    const label = score <= 30 ? 'Low' : score <= 60 ? 'Medium' : 'High';
    const color = score <= 30 ? 'var(--success)' : score <= 60 ? 'var(--warning)' : 'var(--danger)';
    return { score, label, color };
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (error) return (
    <div className="page-content">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  const risk = getRiskPreview();

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/deployments')}
          style={{ marginBottom: 'var(--space-3)', padding: '0.3rem 0.75rem', gap: '0.4rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          All Deployments
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {dep.applicationName}
              </h1>
              <span className={`badge status-${dep.status}`}>{STATUS_LABELS[dep.status]}</span>
              <span className={`badge env-${dep.environment}`}>{ENV_ICONS[dep.environment]} {dep.environment}</span>
            </div>
            <code style={{ fontSize: '0.8rem', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: 4 }}>
              {dep.deploymentId}
            </code>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {dep.status === 'DRAFT' && (isOwner || isAdminOrRM) && (
              <>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/deployments/${dep.id}/edit`)}>
                  Edit
                </button>
                <button className="btn btn-sm" disabled={actionLoading}
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
                  onClick={handleSubmit}>
                  {actionLoading ? <div className="spinner" /> : 'Submit for Review'}
                </button>
                <button className="btn btn-danger btn-sm" disabled={actionLoading}
                  onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Left: details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Basic Details */}
          <div className="form-section" style={{ margin: 0 }}>
            <div className="form-section-title">📋 Deployment Details</div>
            <DetailField label="Application Name">{dep.applicationName}</DetailField>
            <DetailField label="Version">
              <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>v{dep.version}</code>
            </DetailField>
            <DetailField label="Environment">
              <span className={`badge env-${dep.environment}`}>{ENV_ICONS[dep.environment]} {dep.environment}</span>
            </DetailField>
            <DetailField label="Deployment Date">{formatDate(dep.deploymentDate)}</DetailField>
            <DetailField label="Description">
              <span style={{ color: dep.deploymentDescription ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                {dep.deploymentDescription || 'No description provided'}
              </span>
            </DetailField>
          </div>

          {/* Risk Factors */}
          <div className="form-section" style={{ margin: 0 }}>
            <div className="form-section-title">⚠️ Risk Factors</div>
            {[
              { label: 'Modified Files', value: dep.modifiedFilesCount, warn: dep.modifiedFilesCount > 20, warnText: '(High: > 20)' },
              { label: 'Previous Failures', value: dep.previousFailureCount, warn: dep.previousFailureCount > 0 },
            ].map((f, i) => (
              <div key={i} className="detail-field">
                <div className="detail-label">{f.label}</div>
                <div className="detail-value" style={{ color: f.warn ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {f.value} {f.warn && f.warnText && <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>{f.warnText}</span>}
                </div>
              </div>
            ))}
            <div className="detail-field">
              <div className="detail-label">Critical Config Change</div>
              <div className="detail-value">
                {dep.hasCriticalConfigChange
                  ? <span style={{ color: 'var(--danger)' }}>⚠️ Yes (+30 risk)</span>
                  : <span style={{ color: 'var(--success)' }}>✅ No</span>}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Dependency Conflict</div>
              <div className="detail-value">
                {dep.hasDependencyConflict
                  ? <span style={{ color: 'var(--danger)' }}>⚠️ Yes (+15 risk)</span>
                  : <span style={{ color: 'var(--success)' }}>✅ No</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Risk Preview */}
          <div style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-4)' }}>
              Risk Preview
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto var(--space-4)',
                background: `conic-gradient(${risk.color} ${risk.score * 3.6}deg, var(--bg-card) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-surface)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: risk.color, lineHeight: 1 }}>{risk.score}</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: risk.color, fontSize: '1.1rem' }}>{risk.label} Risk</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Full analysis in Phase 3
              </div>
            </div>
          </div>

          {/* Meta */}
          <div style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-4)' }}>
              Metadata
            </div>
            {[
              { label: 'Created By', value: dep.createdByFullName || dep.createdByUsername },
              { label: 'Created At', value: formatDateTime(dep.createdAt) },
              { label: 'Last Updated', value: formatDateTime(dep.updatedAt) },
              { label: 'Status', value: STATUS_LABELS[dep.status] },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Workflow Status */}
          <div style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-4)' }}>
              Workflow
            </div>
            {['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DEPLOYED'].map((s, i, arr) => {
              const statuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DEPLOYED'];
              const currentIdx = statuses.indexOf(dep.status);
              const stepIdx = statuses.indexOf(s);
              const isDone = currentIdx > stepIdx || dep.status === s;
              const isCurrent = dep.status === s;
              const isRejected = dep.status === 'REJECTED' && s === 'PENDING_REVIEW';
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: i < arr.length - 1 ? 'var(--space-3)' : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: isCurrent ? 'var(--primary)' : isDone ? 'rgba(16,185,129,0.2)' : 'var(--bg-input)',
                    border: `2px solid ${isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border-subtle)'}`,
                    color: isCurrent ? '#fff' : isDone ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {isDone && !isCurrent ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--success)' : 'var(--text-muted)', fontWeight: isCurrent ? 600 : 400 }}>
                    {STATUS_LABELS[s]}
                    {isCurrent && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--primary-light)' }}>← current</span>}
                  </span>
                </div>
              );
            })}
            {dep.status === 'REJECTED' && (
              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#f87171' }}>
                ❌ This deployment was rejected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetails;
