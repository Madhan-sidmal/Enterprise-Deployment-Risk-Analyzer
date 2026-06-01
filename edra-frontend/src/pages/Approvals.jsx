import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import approvalService from '../services/approval.service';
import riskService from '../services/risk.service';
import RiskScoreWidget from '../components/RiskScoreWidget';
import { useAuth } from '../context/AuthContext';
import '../styles/deployments.css';
import '../styles/risk.css';

const ENV_ICONS = { DEVELOPMENT: '💻', STAGING: '🔬', UAT: '🧪', PRODUCTION: '🚀' };

const CommentModal = ({ deployment, action, onConfirm, onCancel }) => {
  const [comment, setComment] = useState('');
  const isApprove = action === 'approve';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
        width: '100%', maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {isApprove ? '✅ Approve Deployment' : '❌ Reject Deployment'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
          <strong>{deployment?.applicationName}</strong> — v{deployment?.version} · {deployment?.environment}
        </div>

        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">
            {isApprove ? 'Approval Comment (optional)' : 'Rejection Reason *'}
          </label>
          <textarea className="form-input" rows={4}
            placeholder={isApprove
              ? 'LGTM. Risk analysis reviewed. Approved for production.'
              : 'Describe why this deployment is being rejected...'}
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.6 }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${isApprove ? 'btn-primary' : 'btn-danger'}`}
            onClick={() => onConfirm(comment)}
            disabled={!isApprove && !comment.trim()}
          >
            {isApprove ? '✅ Confirm Approve' : '❌ Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Approvals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('queue');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [riskMap, setRiskMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { deployment, action }
  const [actionLoading, setActionLoading] = useState(null);

  const isAdminOrRM = user?.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_RELEASE_MANAGER');

  useEffect(() => {
    Promise.all([
      approvalService.getPending().catch(() => []),
      approvalService.getHistory().catch(() => []),
      approvalService.getStats().catch(() => null),
    ]).then(([p, h, s]) => {
      setPending(p);
      setHistory(h);
      setStats(s);
      // Fetch risk scores for pending deployments
      Promise.all(p.map(dep =>
        riskService.getRiskScore(dep.id).catch(() => null)
      )).then(scores => {
        const map = {};
        scores.forEach((s, i) => { if (s) map[p[i].id] = s; });
        setRiskMap(map);
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (comment) => {
    if (!modal) return;
    const { deployment, action } = modal;
    setModal(null);
    setActionLoading(deployment.id);
    try {
      if (action === 'approve') {
        const record = await approvalService.approve(deployment.id, comment);
        setPending(prev => prev.filter(d => d.id !== deployment.id));
        setHistory(prev => [record, ...prev]);
        setStats(prev => prev ? { ...prev, pendingQueue: (prev.pendingQueue || 1) - 1, approved: (prev.approved || 0) + 1, totalReviewed: (prev.totalReviewed || 0) + 1 } : prev);
      } else {
        const record = await approvalService.reject(deployment.id, comment);
        setPending(prev => prev.filter(d => d.id !== deployment.id));
        setHistory(prev => [record, ...prev]);
        setStats(prev => prev ? { ...prev, pendingQueue: (prev.pendingQueue || 1) - 1, rejected: (prev.rejected || 0) + 1, totalReviewed: (prev.totalReviewed || 0) + 1 } : prev);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDeployed = async (depId) => {
    if (!window.confirm('Mark this deployment as DEPLOYED?')) return;
    setActionLoading(depId);
    try {
      await approvalService.markDeployed(depId);
      const [h] = await Promise.all([approvalService.getHistory().catch(() => history)]);
      setHistory(h);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-in">
      {/* Modal */}
      {modal && (
        <CommentModal
          deployment={modal.deployment}
          action={modal.action}
          onConfirm={handleDecision}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>✅ Approval Workflow</h1>
          <p>Review, approve, or reject deployments pending sign-off</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['queue', 'history'].map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}>
              {t === 'queue'
                ? <>🔔 Pending Queue {pending.length > 0 && <span style={{ marginLeft: 4, background: 'var(--danger)', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{pending.length}</span>}</>
                : '📋 Review History'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Pending Review', value: stats?.pendingQueue ?? 0,  icon: '⏳', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
          { label: 'Total Reviewed', value: stats?.totalReviewed ?? 0, icon: '🔬', color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.15)' },
          { label: 'Approved',       value: stats?.approved ?? 0,       icon: '✅', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
          { label: 'Rejected',       value: stats?.rejected ?? 0,       icon: '❌', color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUEUE TAB ──────────────────────────────────── */}
      {tab === 'queue' && (
        <div>
          {!isAdminOrRM && (
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
              👀 You are viewing the approval queue in read-only mode. Only Release Managers and Admins can approve or reject.
            </div>
          )}

          {pending.length === 0 ? (
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">No pending approvals!</div>
                <div className="empty-state-desc">All deployments have been reviewed. Check History for past decisions.</div>
                <button className="btn btn-secondary" onClick={() => setTab('history')}>📋 View History</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {pending.map(dep => {
                const risk = riskMap[dep.id];
                const isLoading = actionLoading === dep.id;
                return (
                  <div key={dep.id} style={{
                    background: 'var(--gradient-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}>
                    {/* Top accent strip */}
                    <div style={{ height: 3, background: 'var(--gradient-primary)' }} />

                    <div style={{ padding: 'var(--space-6)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-6)', alignItems: 'start' }}>
                        {/* Left: deployment info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {dep.applicationName}
                            </h3>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent)' }}>v{dep.version}</span>
                            <span className={`badge env-${dep.environment}`}>
                              {ENV_ICONS[dep.environment]} {dep.environment}
                            </span>
                            <span className="badge status-PENDING_REVIEW">Pending Review</span>
                          </div>

                          <code style={{ fontSize: '0.75rem', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.1)', padding: '2px 10px', borderRadius: 4 }}>
                            {dep.deploymentId}
                          </code>

                          {dep.deploymentDescription && (
                            <p style={{ marginTop: 'var(--space-3)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 600 }}>
                              {dep.deploymentDescription}
                            </p>
                          )}

                          {/* Risk factors preview */}
                          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                            {dep.modifiedFilesCount > 0 && (
                              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: dep.modifiedFilesCount > 20 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.1)', color: dep.modifiedFilesCount > 20 ? '#fbbf24' : 'var(--primary-light)' }}>
                                📁 {dep.modifiedFilesCount} files
                              </span>
                            )}
                            {dep.hasCriticalConfigChange && (
                              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                🔧 Critical Config Change
                              </span>
                            )}
                            {dep.hasDependencyConflict && (
                              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                                🔗 Dependency Conflict
                              </span>
                            )}
                            {dep.previousFailureCount > 0 && (
                              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                💥 {dep.previousFailureCount} prev failures
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                            Submitted by <strong style={{ color: 'var(--text-secondary)' }}>{dep.createdByFullName || dep.createdByUsername}</strong>
                            · Deploy date: <strong style={{ color: 'var(--text-secondary)' }}>{dep.deploymentDate}</strong>
                          </div>
                        </div>

                        {/* Right: risk score + actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', minWidth: 160 }}>
                          {risk ? (
                            <RiskScoreWidget score={risk.score} riskLevel={risk.riskLevel} size={110} />
                          ) : (
                            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No risk analysis</div>
                              <button className="btn btn-sm btn-secondary" style={{ marginTop: 'var(--space-2)' }}
                                onClick={() => navigate('/risk-analysis')}>
                                Run Analysis
                              </button>
                            </div>
                          )}

                          {isAdminOrRM && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%' }}>
                              <button
                                id={`approve-btn-${dep.id}`}
                                className="btn btn-sm btn-full"
                                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}
                                disabled={isLoading}
                                onClick={() => setModal({ deployment: dep, action: 'approve' })}>
                                {isLoading ? <div className="spinner" /> : '✅ Approve'}
                              </button>
                              <button
                                id={`reject-btn-${dep.id}`}
                                className="btn btn-sm btn-full btn-danger"
                                disabled={isLoading}
                                onClick={() => setModal({ deployment: dep, action: 'reject' })}>
                                {isLoading ? <div className="spinner" /> : '❌ Reject'}
                              </button>
                              <button className="btn btn-sm btn-full btn-secondary"
                                onClick={() => navigate(`/deployments/${dep.id}`)}>
                                👁 View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ───────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="table-header">
            <div className="table-title">📋 Review History</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{history.length} record(s)</span>
          </div>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No reviews yet</div>
              <div className="empty-state-desc">Approval history will appear here after deployments are reviewed.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Environment</th>
                  <th>Decision</th>
                  <th>Comment</th>
                  <th>Reviewed By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id} className="dep-row">
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.applicationName}</div>
                      <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{record.deploymentUniqueId}</code>
                    </td>
                    <td>
                      <span className={`badge env-${record.environment}`}>
                        {ENV_ICONS[record.environment]} {record.environment}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '0.25rem 0.8rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem', fontWeight: 700,
                        background: record.decision === 'APPROVED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: record.decision === 'APPROVED' ? '#34d399' : '#f87171',
                        border: `1px solid ${record.decision === 'APPROVED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}>
                        {record.decision === 'APPROVED' ? '✅' : '❌'} {record.decision}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: 240 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.comment || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No comment</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {record.reviewedByFullName || record.reviewedByUsername}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatDate(record.reviewedAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/deployments/${record.deploymentId}`)}>
                          View
                        </button>
                        {record.currentStatus === 'APPROVED' && isAdminOrRM && (
                          <button className="btn btn-sm"
                            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.3)' }}
                            disabled={actionLoading === record.deploymentId}
                            onClick={() => handleMarkDeployed(record.deploymentId)}>
                            🚀 Deploy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Approvals;
