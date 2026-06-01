import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/deployments.css';

/* ── Tiny SVG Donut ─────────────────────────────────────── */
const DonutChart = ({ segments, size = 140, label, value }) => {
  const r = 50, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={16} />
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
        ) : segments.map((seg, i) => {
          const pct  = seg.value / total;
          const dash = pct * circ;
          const offset = circ - cumulative * circ / total;
          cumulative += seg.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={10}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-(cumulative - seg.value) * circ / total}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${seg.color}80)`, transition: 'stroke-dasharray 0.8s ease' }}
            />
          );
        })}
      </svg>
      <div style={{ textAlign: 'center' }}>
        {value !== undefined && (
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        )}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
};

/* ── Horizontal Bar ─────────────────────────────────────── */
const HBar = ({ label, value, max, color, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
    <span style={{ fontSize: '1rem', width: 22, flexShrink: 0 }}>{icon}</span>
    <div style={{ width: 90, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    <div style={{ flex: 1, height: 10, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${max > 0 ? (value / max) * 100 : 0}%`, borderRadius: 'var(--radius-full)', background: color, transition: 'width 0.8s ease', filter: `drop-shadow(0 0 4px ${color}60)` }} />
    </div>
    <span style={{ fontWeight: 800, color, fontSize: '0.9rem', minWidth: 28, textAlign: 'right' }}>{value}</span>
  </div>
);

/* ── Main Component ─────────────────────────────────────── */
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (!data) return (
    <div className="page-content">
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">No analytics data</div>
        <div className="empty-state-desc">Create and interact with deployments to generate insights.</div>
      </div>
    </div>
  );

  const depByStatus = data.deploymentsByStatus || {};
  const depByEnv    = data.deploymentsByEnvironment || {};
  const risk        = data.riskDistribution || {};
  const approvals   = data.approvalStats || {};
  const total       = Number(data.totalDeployments ?? 0);

  const statusSegments = [
    { label: 'Draft',         value: Number(depByStatus.DRAFT ?? 0),          color: '#64748b' },
    { label: 'Pending',       value: Number(depByStatus.PENDING_REVIEW ?? 0), color: '#f59e0b' },
    { label: 'Approved',      value: Number(depByStatus.APPROVED ?? 0),       color: '#6366f1' },
    { label: 'Deployed',      value: Number(depByStatus.DEPLOYED ?? 0),       color: '#10b981' },
    { label: 'Rejected',      value: Number(depByStatus.REJECTED ?? 0),       color: '#ef4444' },
  ];

  const envSegments = [
    { label: 'Development',   value: Number(depByEnv.DEVELOPMENT ?? 0), color: '#818cf8' },
    { label: 'Staging',       value: Number(depByEnv.STAGING ?? 0),      color: '#22d3ee' },
    { label: 'UAT',           value: Number(depByEnv.UAT ?? 0),          color: '#fbbf24' },
    { label: 'Production',    value: Number(depByEnv.PRODUCTION ?? 0),   color: '#ef4444' },
  ];

  const maxEnv  = Math.max(...envSegments.map(s => s.value), 1);
  const maxStat = Math.max(Number(depByStatus.DRAFT ?? 0), Number(depByStatus.PENDING_REVIEW ?? 0), Number(depByStatus.APPROVED ?? 0), Number(depByStatus.DEPLOYED ?? 0), Number(depByStatus.REJECTED ?? 0), 1);

  const card = (children, extra = {}) => (
    <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', ...extra }}>
      {children}
    </div>
  );

  const sectionTitle = (title) => (
    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-5)', fontSize: '0.9rem' }}>{title}</div>
  );

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Real-time deployment intelligence and platform health metrics</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Deployments', value: total,                      icon: '📦', color: 'var(--primary-light)' },
          { label: 'Production Deps',   value: data.productionDeps ?? 0,   icon: '🚀', color: '#ef4444' },
          { label: 'Risk Analyses',     value: data.totalRiskScores ?? 0,  icon: '⚠️', color: '#fbbf24' },
          { label: 'Rollback Plans',    value: data.totalRollbacks ?? 0,   icon: '🔁', color: '#22d3ee' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: kpi.color }} />
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
            <div style={{ position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)', fontSize: '2rem', opacity: 0.2 }}>{kpi.icon}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Donut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Deployment by status */}
        {card(<>
          {sectionTitle('📦 Deployments by Status')}
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart segments={statusSegments} label="Deployments" value={total} />
            <div style={{ flex: 1, minWidth: 120 }}>
              {statusSegments.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: '0.85rem' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* By environment */}
        {card(<>
          {sectionTitle('🌍 Deployments by Environment')}
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart segments={envSegments} label="Environments" />
            <div style={{ flex: 1, minWidth: 120 }}>
              {[
                { label: 'Development', icon: '💻', color: '#818cf8', value: Number(depByEnv.DEVELOPMENT ?? 0) },
                { label: 'Staging',     icon: '🔬', color: '#22d3ee', value: Number(depByEnv.STAGING ?? 0) },
                { label: 'UAT',         icon: '🧪', color: '#fbbf24', value: Number(depByEnv.UAT ?? 0) },
                { label: 'Production',  icon: '🚀', color: '#ef4444', value: Number(depByEnv.PRODUCTION ?? 0) },
              ].map((e, i) => <HBar key={i} {...e} max={maxEnv} />)}
            </div>
          </div>
        </>)}

        {/* Risk distribution */}
        {card(<>
          {sectionTitle('⚠️ Risk Distribution')}
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart
              segments={[
                { label: 'Low',    value: Number(risk.low ?? 0),    color: '#10b981' },
                { label: 'Medium', value: Number(risk.medium ?? 0), color: '#f59e0b' },
                { label: 'High',   value: Number(risk.high ?? 0),   color: '#ef4444' },
              ]}
              label="Analyses"
            />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Low Risk',    color: '#10b981', value: Number(risk.low ?? 0),    icon: '🟢' },
                { label: 'Medium Risk', color: '#f59e0b', value: Number(risk.medium ?? 0), icon: '🟡' },
                { label: 'High Risk',   color: '#ef4444', value: Number(risk.high ?? 0),   icon: '🔴' },
              ].map((r, i) => <HBar key={i} {...r} max={Math.max(Number(risk.low ?? 0), Number(risk.medium ?? 0), Number(risk.high ?? 0), 1)} />)}
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Risk Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: Number(risk.avgScore ?? 0) > 60 ? '#ef4444' : Number(risk.avgScore ?? 0) > 30 ? '#f59e0b' : '#10b981' }}>
                  {(Number(risk.avgScore ?? 0)).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </>)}
      </div>

      {/* Row 3: Deployment status breakdown + Approval funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {card(<>
          {sectionTitle('📋 Deployment Status Breakdown')}
          {[
            { label: 'Draft',         color: '#64748b', value: Number(depByStatus.DRAFT ?? 0),          icon: '📝' },
            { label: 'Pending Review',color: '#f59e0b', value: Number(depByStatus.PENDING_REVIEW ?? 0), icon: '⏳' },
            { label: 'Approved',      color: '#6366f1', value: Number(depByStatus.APPROVED ?? 0),       icon: '✅' },
            { label: 'Deployed',      color: '#10b981', value: Number(depByStatus.DEPLOYED ?? 0),       icon: '🚀' },
            { label: 'Rejected',      color: '#ef4444', value: Number(depByStatus.REJECTED ?? 0),       icon: '❌' },
          ].map((s, i) => <HBar key={i} {...s} max={maxStat} />)}
        </>)}

        {card(<>
          {sectionTitle('✅ Approval Funnel')}
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
            <DonutChart
              segments={[
                { label: 'Approved', value: Number(approvals.approved ?? 0), color: '#10b981' },
                { label: 'Rejected', value: Number(approvals.rejected ?? 0), color: '#ef4444' },
              ]}
              label="Reviews"
              value={Number(approvals.approved ?? 0) + Number(approvals.rejected ?? 0)}
            />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Approved', value: Number(approvals.approved ?? 0), color: '#10b981', icon: '✅' },
                { label: 'Rejected', value: Number(approvals.rejected ?? 0), color: '#ef4444', icon: '❌' },
              ].map((a, i) => <HBar key={i} {...a} max={Math.max(Number(approvals.approved ?? 0), Number(approvals.rejected ?? 0), 1)} />)}
              {(Number(approvals.approved ?? 0) + Number(approvals.rejected ?? 0)) > 0 && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approval Rate</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                    {((Number(approvals.approved ?? 0) / (Number(approvals.approved ?? 0) + Number(approvals.rejected ?? 0))) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
};

export default Analytics;
