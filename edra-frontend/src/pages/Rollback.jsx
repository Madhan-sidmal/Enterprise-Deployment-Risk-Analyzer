import React, { useEffect, useState } from 'react';
import rollbackService from '../services/rollback.service';
import deploymentService from '../services/deployment.service';
import '../styles/deployments.css';

const RISK_COLORS = {
  LOW:    { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  HIGH:   { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

const STATUS_STYLES = {
  SIMULATED: { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  INITIATED: { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  COMPLETED: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  FAILED:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

const Rollback = () => {
  const [tab, setTab] = useState('simulate');
  const [deployments, setDeployments] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [form, setForm] = useState({ deploymentId: '', rollbackToVersion: '', reason: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      deploymentService.getAll().catch(() => []),
      rollbackService.getAll().catch(() => []),
    ]).then(([deps, plans]) => {
      setDeployments(deps);
      setAllPlans(plans);
    });
  }, []);

  const selectedDep = deployments.find(d => d.id === parseInt(form.deploymentId));

  const handleSimulate = async () => {
    if (!form.deploymentId || !form.rollbackToVersion.trim()) {
      setError('Select a deployment and enter the rollback version');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const plan = await rollbackService.simulate({
        deploymentId: parseInt(form.deploymentId),
        rollbackToVersion: form.rollbackToVersion.trim(),
        reason: form.reason.trim(),
      });
      setResult(plan);
      setAllPlans(prev => [plan, ...prev]);
      setTab('result');
    } catch (err) {
      setError(err?.response?.data?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!result || !window.confirm('Initiate rollback? This will change the status to INITIATED.')) return;
    setInitiating(true);
    try {
      const updated = await rollbackService.initiate(result.id);
      setResult(updated);
      setAllPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to initiate');
    } finally {
      setInitiating(false);
    }
  };

  const getFeasibilityBar = (score) => {
    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--bg-input)', overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', borderRadius: 'var(--radius-full)', background: color, transition: 'width 0.8s ease' }} />
        </div>
        <span style={{ fontWeight: 800, color, minWidth: 36, fontSize: '0.95rem' }}>{score}%</span>
      </div>
    );
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>🔁 Rollback Simulator</h1>
          <p>Simulate and plan deployment rollbacks before executing in production</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['simulate', 'result', 'history'].map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'simulate' ? '🔬 Simulate' : t === 'result' ? '📋 Plan' : '📚 History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── SIMULATE TAB ─────────────────────────────────── */}
      {tab === 'simulate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 'var(--space-6)' }}>
          {/* Form */}
          <div>
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <div className="form-section">
              <div className="form-section-title">🎯 Rollback Target</div>

              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label">Select Deployment *</label>
                <select className="form-select" value={form.deploymentId}
                  onChange={e => setForm(f => ({ ...f, deploymentId: e.target.value }))}>
                  <option value="">-- Choose a deployment --</option>
                  {deployments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.applicationName} v{d.version} ({d.environment})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDep && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Current Deployment</div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    {[
                      { label: 'App', value: selectedDep.applicationName },
                      { label: 'Version', value: `v${selectedDep.version}` },
                      { label: 'Env', value: selectedDep.environment },
                      { label: 'Status', value: selectedDep.status },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label">Rollback to Version *</label>
                <input className="form-input" placeholder="e.g. 2.3.0, 1.0.0" value={form.rollbackToVersion}
                  onChange={e => setForm(f => ({ ...f, rollbackToVersion: e.target.value }))} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enter the version you want to revert to</span>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Rollback</label>
                <textarea className="form-input" rows={4} placeholder="Describe the issue that triggered this rollback request..."
                  value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={{ resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </div>

            <button className="btn btn-primary btn-lg btn-full" onClick={handleSimulate} disabled={loading}>
              {loading ? <><div className="spinner" /> Running Simulation...</> : '🔬 Run Rollback Simulation'}
            </button>
          </div>

          {/* Info sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
                📖 What does the simulator do?
              </div>
              {[
                { icon: '📋', title: 'Step-by-step plan', desc: 'Generates a complete rollback runbook tailored to your deployment' },
                { icon: '⏱️', title: 'Downtime estimation', desc: 'Estimates total downtime based on environment and complexity' },
                { icon: '🎯', title: 'Feasibility score', desc: 'Scores how safely the rollback can be executed (0–100)' },
                { icon: '⚠️', title: 'Risk assessment', desc: 'Flags high-risk steps like config reverts and DB migrations' },
                { icon: '🤖', title: 'Automation flags', desc: 'Marks which steps can be automated vs. require manual work' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {allPlans.length > 0 && (
              <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
                  📚 Recent Simulations
                </div>
                {allPlans.slice(0, 3).map((p, i) => (
                  <div key={i} className="dep-row" onClick={() => { setResult(p); setTab('result'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.applicationName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>→ v{p.rollbackToVersion}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.feasibilityScore >= 70 ? '#34d399' : p.feasibilityScore >= 40 ? '#fbbf24' : '#f87171' }}>
                      {p.feasibilityScore}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESULT TAB ─────────────────────────────────── */}
      {tab === 'result' && result && (
        <div>
          {/* Header card */}
          <div style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Rollback Plan</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {result.applicationName} — v{result.currentVersion} → v{result.rollbackToVersion}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {(() => {
                    const s = STATUS_STYLES[result.status] || STATUS_STYLES.SIMULATED;
                    return <span style={{ padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{result.status}</span>;
                  })()}
                  <span style={{ padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {result.stepsCount} steps
                  </span>
                  <span style={{ padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(6,182,212,0.12)', color: 'var(--accent)', border: '1px solid rgba(6,182,212,0.3)' }}>
                    ~{result.estimatedDowntimeMinutes} min downtime
                  </span>
                </div>
              </div>
              {result.status === 'SIMULATED' && (
                <button className="btn btn-danger" onClick={handleInitiate} disabled={initiating}>
                  {initiating ? <><div className="spinner" /> Initiating...</> : '🚀 Initiate Rollback'}
                </button>
              )}
            </div>

            {/* Feasibility */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Feasibility Score</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: result.feasibilityColor }}>{result.feasibilityLabel} Feasibility</span>
              </div>
              {getFeasibilityBar(result.feasibilityScore)}
            </div>

            {/* Notes */}
            {result.notes && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                💡 {result.notes}
              </div>
            )}
          </div>

          {/* Steps timeline */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)', fontSize: '0.9rem' }}>
              📋 Rollback Runbook ({result.simulationSteps?.length ?? 0} steps)
            </div>
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }} />

              {(result.simulationSteps || []).map((step, i) => {
                const riskStyle = RISK_COLORS[step.risk] || RISK_COLORS.LOW;
                return (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-5)', marginBottom: 'var(--space-5)', position: 'relative', zIndex: 1 }}>
                    {/* Step number circle */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-surface)', border: `2px solid ${riskStyle.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', color: riskStyle.color
                    }}>
                      {step.stepNumber}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: `1px solid ${step.risk === 'HIGH' ? riskStyle.border : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{step.title}</div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: riskStyle.bg, color: riskStyle.color, border: `1px solid ${riskStyle.border}` }}>
                          {step.risk} RISK
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: step.automated ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: step.automated ? '#34d399' : '#fbbf24' }}>
                          {step.automated ? '🤖 Auto' : '👤 Manual'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {step.estimatedTime}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'result' && !result && (
        <div className="empty-state">
          <div className="empty-state-icon">🔁</div>
          <div className="empty-state-title">No simulation result</div>
          <div className="empty-state-desc">Run a simulation first to see the rollback plan.</div>
          <button className="btn btn-primary" onClick={() => setTab('simulate')}>🔬 Go to Simulate</button>
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="table-header">
            <div className="table-title">📚 Rollback History</div>
            <button className="btn btn-primary btn-sm" onClick={() => setTab('simulate')}>+ New Simulation</button>
          </div>
          {allPlans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔁</div>
              <div className="empty-state-title">No rollback plans yet</div>
              <div className="empty-state-desc">Simulate your first rollback to get started.</div>
              <button className="btn btn-primary" onClick={() => setTab('simulate')}>🔬 Simulate</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>From → To</th>
                  <th>Feasibility</th>
                  <th>Downtime</th>
                  <th>Steps</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allPlans.map(plan => {
                  const s = STATUS_STYLES[plan.status] || STATUS_STYLES.SIMULATED;
                  return (
                    <tr key={plan.id} className="dep-row" onClick={() => { setResult(plan); setTab('result'); }}>
                      <td style={{ fontWeight: 600 }}>{plan.applicationName}</td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          v{plan.currentVersion} → v{plan.rollbackToVersion}
                        </code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--bg-input)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${plan.feasibilityScore}%`, background: plan.feasibilityColor, borderRadius: 'var(--radius-full)' }} />
                          </div>
                          <span style={{ fontWeight: 700, color: plan.feasibilityColor, fontSize: '0.85rem' }}>{plan.feasibilityScore}%</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>~{plan.estimatedDowntimeMinutes} min</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{plan.stepsCount} steps</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.7rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {plan.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Rollback;
