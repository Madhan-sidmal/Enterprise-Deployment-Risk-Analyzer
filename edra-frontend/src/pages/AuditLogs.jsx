import React, { useEffect, useState, useCallback } from 'react';
import auditService from '../services/audit.service';
import '../styles/deployments.css';

const ACTION_STYLES = {
  DEPLOYMENT_CREATED:   { icon: '➕', bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  DEPLOYMENT_UPDATED:   { icon: '✏️', bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee' },
  DEPLOYMENT_DELETED:   { icon: '🗑️', bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  DEPLOYMENT_SUBMITTED: { icon: '📤', bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  DEPLOYMENT_DEPLOYED:  { icon: '🚀', bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  DEPLOYMENT_APPROVED:  { icon: '✅', bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  DEPLOYMENT_REJECTED:  { icon: '❌', bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  RISK_ANALYZED:        { icon: '⚠️', bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  DEPENDENCY_ANALYZED:  { icon: '🌐', bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  ROLLBACK_SIMULATED:   { icon: '🔁', bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee' },
  ROLLBACK_INITIATED:   { icon: '🔴', bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  USER_REGISTERED:      { icon: '👤', bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  USER_LOGGED_IN:       { icon: '🔓', bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc' },
  USER_LOGGED_OUT:      { icon: '🔒', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
};

const ROLE_COLORS = {
  ROLE_ADMIN:           { color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  ROLE_RELEASE_MANAGER: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
  ROLE_DEVELOPER:       { color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
  SYSTEM:               { color: '#94a3b8', bg: 'rgba(100,116,139,0.1)' },
};

const PAGE_SIZE = 25;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const data = await auditService.getAll(p, PAGE_SIZE);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(0);
    auditService.getStats().then(setStats).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!searchQ.trim()) { fetchLogs(0); return; }
    setSearching(true);
    try {
      const data = await auditService.search(searchQ.trim(), 0, PAGE_SIZE);
      setLogs(data.logs || []);
      setTotal(data.logs?.length ?? 0);
    } finally {
      setSearching(false);
    }
  };

  const filtered = actionFilter
    ? logs.filter(l => l.action === actionFilter)
    : logs;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📜 Audit Logs</h1>
          <p>Full immutable trail of every system action</p>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>{total.toLocaleString()}</div>
          total events logged
        </div>
      </div>

      {/* Stats pills */}
      {stats && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          {Object.entries(stats.byAction || {}).map(([action, count]) => {
            const style = ACTION_STYLES[action] || { icon: '⚡', bg: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)' };
            return (
              <button key={action}
                className={`filter-chip ${actionFilter === action ? 'active' : ''}`}
                onClick={() => setActionFilter(actionFilter === action ? '' : action)}
                style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}30` }}>
                {style.icon} {action.replace(/_/g, ' ')} <span style={{ marginLeft: 4, fontWeight: 800 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div className="form-input-icon-wrap" style={{ flex: 1 }}>
          <span className="form-input-icon">🔍</span>
          <input className="form-input" placeholder="Search by application name..." value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
          {searching ? <><div className="spinner" /> Searching...</> : 'Search'}
        </button>
        {searchQ && (
          <button className="btn btn-secondary" onClick={() => { setSearchQ(''); fetchLogs(0); }}>
            Clear
          </button>
        )}
        {actionFilter && (
          <button className="btn btn-ghost" onClick={() => setActionFilter('')}>
            ✕ Clear Filter
          </button>
        )}
      </div>

      {/* Log table */}
      <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div className="table-header">
          <div className="table-title">📋 Event Log</div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} entries shown</span>
            <button className="btn btn-sm btn-secondary" onClick={() => fetchLogs(page)}>🔄 Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">No audit logs yet</div>
            <div className="empty-state-desc">Events will be recorded here as users interact with the system.</div>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Timestamp</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const style = ACTION_STYLES[log.action] || { icon: '⚡', bg: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)' };
                  const roleStyle = ROLE_COLORS[log.performedByRole] || ROLE_COLORS.SYSTEM;
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="dep-row" onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        style={{ borderLeft: `3px solid ${style.color}` }}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                          {page * PAGE_SIZE + i + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: style.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                              {style.icon}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: style.color }}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {log.entityName || '—'}
                          </div>
                          {log.entityType && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {log.entityType} #{log.entityId}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {log.performedByFullName || log.performedByUsername}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: roleStyle.bg, color: roleStyle.color }}>
                            {(log.performedByRole || 'SYSTEM').replace('ROLE_', '')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(log.performedAt)}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {isExpanded ? '▲' : '▼'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                                {[
                                  { label: 'Log ID',    value: `#${log.id}` },
                                  { label: 'Entity Type', value: log.entityType || '—' },
                                  { label: 'Entity ID',  value: log.entityId ? `#${log.entityId}` : '—' },
                                  { label: 'Username',   value: log.performedByUsername },
                                  { label: 'Full Name',  value: log.performedByFullName || '—' },
                                  { label: 'Timestamp',  value: formatDate(log.performedAt) },
                                ].map((item, j) => (
                                  <div key={j}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{item.value}</div>
                                  </div>
                                ))}
                              </div>
                              {log.details && (
                                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                  {log.details}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && !searchQ && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-5)', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => fetchLogs(page - 1)}>← Prev</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
                <button className="btn btn-sm btn-secondary" disabled={page >= totalPages - 1} onClick={() => fetchLogs(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
