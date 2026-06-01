import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import riskService from '../services/risk.service';
import deploymentService from '../services/deployment.service';
import RiskScoreWidget from '../components/RiskScoreWidget';
import '../styles/risk.css';
import '../styles/deployments.css';

const FACTOR_ICONS = {
  'Modified Files':       { icon: '📁', bg: 'rgba(99,102,241,0.15)' },
  'Production Environment': { icon: '🚀', bg: 'rgba(239,68,68,0.15)' },
  'Critical Config Change': { icon: '🔧', bg: 'rgba(239,68,68,0.15)' },
  'Dependency Conflict':  { icon: '🔗', bg: 'rgba(245,158,11,0.15)' },
  'Failure History':      { icon: '💥', bg: 'rgba(239,68,68,0.12)' },
};

const MAX_CONTRIBUTIONS = {
  'Modified Files': 20, 'Production Environment': 25,
  'Critical Config Change': 30, 'Dependency Conflict': 15, 'Failure History': 10,
};

const RiskAnalysis = () => {
  const navigate = useNavigate();
  const [riskScores, setRiskScores] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'analyze' | 'detail'

  useEffect(() => {
    Promise.all([
      riskService.getAll().catch(() => []),
      deploymentService.getAll().catch(() => []),
      riskService.getStats().catch(() => null),
    ]).then(([scores, deps, s]) => {
      setRiskScores(scores);
      setDeployments(deps);
      setStats(s);
    }).finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (deploymentId) => {
    setAnalyzing(deploymentId);
    try {
      const result = await riskService.analyze(deploymentId);
      setRiskScores(prev => {
        const exists = prev.find(r => r.deploymentId === deploymentId);
        if (exists) return prev.map(r => r.deploymentId === deploymentId ? result : r);
        return [result, ...prev];
      });
      const s = await riskService.getStats();
      setStats(s);
      setSelectedRisk(result);
      setTab('detail');
    } catch (err) {
      alert(err?.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzedIds = new Set(riskScores.map(r => r.deploymentId));
  const unanalyzedDeps = deployments.filter(d => !analyzedIds.has(d.id));

  const getLevelColor = (level) =>
    level === 'HIGH' ? 'var(--risk-high)' : level === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)';

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>⚠️ Risk Analysis Engine</h1>
          <p>Analyze deployment risk before pushing to production</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['dashboard', 'analyze'].map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'dashboard' ? '📊 Dashboard' : '🔬 Analyze Deployment'}
            </button>
          ))}
        </div>
      </div>

      {/* ── DETAIL VIEW ──────────────────────────────────── */}
      {tab === 'detail' && selectedRisk && (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setTab('dashboard')}
            style={{ marginBottom: 'var(--space-4)', gap: '0.4rem', padding: '0.3rem 0.75rem' }}>
            ← Back to Dashboard
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-6)' }}>
            {/* Score card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{
                background: 'var(--gradient-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>
                    {selectedRisk.applicationName}
                  </div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    {selectedRisk.deploymentUniqueId}
                  </code>
                </div>

                <RiskScoreWidget score={selectedRisk.score} riskLevel={selectedRisk.riskLevel} size={180} />

                {/* Probability */}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Failure Probability</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: getLevelColor(selectedRisk.riskLevel) }}>
                      {selectedRisk.failureProbability}%
                    </span>
                  </div>
                  <div className="prob-bar-wrap">
                    <div className="prob-bar-fill" style={{
                      width: `${selectedRisk.failureProbability}%`,
                      background: `linear-gradient(90deg, ${getLevelColor(selectedRisk.riskLevel)}88, ${getLevelColor(selectedRisk.riskLevel)})`
                    }} />
                  </div>
                </div>

                {/* Score breakdown */}
                <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-3)' }}>
                    Score Breakdown
                  </div>
                  {[
                    { label: 'Modified Files',    val: selectedRisk.scoreModifiedFiles,      max: 20, icon: '📁' },
                    { label: 'Production Env',    val: selectedRisk.scoreProduction,          max: 25, icon: '🚀' },
                    { label: 'Critical Config',   val: selectedRisk.scoreCriticalConfig,      max: 30, icon: '🔧' },
                    { label: 'Dependency Conflict', val: selectedRisk.scoreDependencyConflict, max: 15, icon: '🔗' },
                    { label: 'Failure History',   val: selectedRisk.scoreFailureHistory,      max: 10, icon: '💥' },
                  ].map(item => (
                    <div key={item.label} style={{ marginBottom: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{item.icon} {item.label}</span>
                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: item.val > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          +{item.val}
                        </span>
                      </div>
                      <div className="score-meter">
                        <div className="score-meter-fill" style={{
                          width: `${(item.val / item.max) * 100}%`,
                          background: item.val > 0
                            ? `linear-gradient(90deg, ${getLevelColor(selectedRisk.riskLevel)}88, ${getLevelColor(selectedRisk.riskLevel)})`
                            : 'var(--border-subtle)'
                        }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Score</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: getLevelColor(selectedRisk.riskLevel) }}>{selectedRisk.score}/100</span>
                  </div>
                </div>
              </div>

              {/* Re-analyze */}
              <button className="btn btn-secondary btn-full" onClick={() => handleAnalyze(selectedRisk.deploymentId)}
                disabled={analyzing === selectedRisk.deploymentId}>
                {analyzing === selectedRisk.deploymentId ? <><div className="spinner" /> Analyzing...</> : '🔄 Re-analyze'}
              </button>
            </div>

            {/* Right: factors + recommendation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Recommendation */}
              <div style={{
                background: selectedRisk.riskLevel === 'HIGH'
                  ? 'rgba(239,68,68,0.06)' : selectedRisk.riskLevel === 'MEDIUM'
                  ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
                border: `1px solid ${getLevelColor(selectedRisk.riskLevel)}30`,
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', fontSize: '0.9rem' }}>
                  💡 Recommendation
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {selectedRisk.recommendation}
                </p>
              </div>

              {/* Risk factors */}
              <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-5)', fontSize: '0.9rem' }}>
                  🔍 Risk Factor Analysis
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {(selectedRisk.factors || []).map((factor, i) => {
                    const meta = FACTOR_ICONS[factor.name] || { icon: '⚡', bg: 'rgba(99,102,241,0.15)' };
                    const maxScore = MAX_CONTRIBUTIONS[factor.name] || 30;
                    return (
                      <div key={i} className={`factor-row ${factor.triggered ? 'triggered' : ''} severity-${factor.severity}`}>
                        <div className="factor-icon" style={{ background: factor.triggered ? `${getLevelColor(selectedRisk.riskLevel)}18` : 'var(--bg-input)' }}>
                          {meta.icon}
                        </div>
                        <div className="factor-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div className="factor-name">{factor.name}</div>
                            {factor.triggered && (
                              <span className={`severity-chip severity-${factor.severity}`}>
                                {factor.severity}
                              </span>
                            )}
                          </div>
                          <div className="factor-desc">{factor.description}</div>
                          <div className="score-meter" style={{ marginTop: 8, height: 6 }}>
                            <div className="score-meter-fill" style={{
                              width: factor.triggered ? '100%' : '0%',
                              background: factor.triggered ? getLevelColor(selectedRisk.riskLevel) : 'var(--border-subtle)',
                              transition: `width 1s ease ${i * 0.1}s`
                            }} />
                          </div>
                        </div>
                        <div className="factor-score" style={{ color: factor.triggered ? getLevelColor(selectedRisk.riskLevel) : 'var(--text-muted)' }}>
                          {factor.triggered ? `+${factor.contribution}` : '+0'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick view deployment */}
              <button className="btn btn-secondary"
                onClick={() => navigate(`/deployments/${selectedRisk.deploymentId}`)}>
                View Full Deployment Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZE TAB ──────────────────────────────────── */}
      {tab === 'analyze' && (
        <div>
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
            <div className="table-header">
              <div className="table-title">📦 Deployments Pending Analysis</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unanalyzedDeps.length} deployment(s)</span>
            </div>
            {unanalyzedDeps.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">All deployments analyzed!</div>
                <div className="empty-state-desc">Every deployment has been risk-scored. Re-analyze from the dashboard.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Deployment ID</th>
                    <th>Application</th>
                    <th>Version</th>
                    <th>Environment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unanalyzedDeps.map(dep => (
                    <tr key={dep.id} className="risk-table-row">
                      <td><code style={{ fontSize: '0.78rem', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>{dep.deploymentId}</code></td>
                      <td style={{ fontWeight: 600 }}>{dep.applicationName}</td>
                      <td><code style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>v{dep.version}</code></td>
                      <td><span className={`badge env-${dep.environment}`}>{dep.environment}</span></td>
                      <td><span className={`badge status-${dep.status}`}>{dep.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-primary btn-sm"
                          disabled={analyzing === dep.id}
                          onClick={() => handleAnalyze(dep.id)}>
                          {analyzing === dep.id ? <><div className="spinner" /> Analyzing...</> : '🔬 Analyze Risk'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Already analyzed */}
          {riskScores.length > 0 && (
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="table-header">
                <div className="table-title">✅ Already Analyzed</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Risk Score</th>
                    <th>Level</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {riskScores.map(r => (
                    <tr key={r.id} className="risk-table-row" onClick={() => { setSelectedRisk(r); setTab('detail'); }}>
                      <td style={{ fontWeight: 600 }}>{r.applicationName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 100, height: 8, borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-input)', overflow: 'hidden'
                          }}>
                            <div style={{ height: '100%', width: `${r.score}%`, borderRadius: 'var(--radius-full)', background: getLevelColor(r.riskLevel) }} />
                          </div>
                          <span style={{ fontWeight: 700, color: getLevelColor(r.riskLevel) }}>{r.score}</span>
                        </div>
                      </td>
                      <td><span className={`risk-badge-lg risk-${r.riskLevel}`}>{r.riskCategory}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm btn-secondary"
                          onClick={(e) => { e.stopPropagation(); handleAnalyze(r.deploymentId); }}
                          disabled={analyzing === r.deploymentId}>
                          {analyzing === r.deploymentId ? <><div className="spinner" /></> : '🔄 Re-analyze'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DASHBOARD TAB ─────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            {[
              { label: 'Analyzed', value: stats?.totalAnalyzed ?? 0, icon: '🔬', color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.15)' },
              { label: 'Low Risk', value: stats?.lowRisk ?? 0, icon: '🟢', color: 'var(--risk-low)', bg: 'rgba(16,185,129,0.15)' },
              { label: 'Medium Risk', value: stats?.mediumRisk ?? 0, icon: '🟡', color: 'var(--risk-medium)', bg: 'rgba(245,158,11,0.15)' },
              { label: 'High Risk', value: stats?.highRisk ?? 0, icon: '🔴', color: 'var(--risk-high)', bg: 'rgba(239,68,68,0.15)' },
            ].map((s, i) => (
              <div key={i} className="stat-ring" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 'var(--space-2)' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Avg scores */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Average Risk Score (All)', value: stats.averageScore, max: 100 },
                { label: 'Average Risk Score (Production)', value: stats.avgProductionScore, max: 100 },
              ].map((m, i) => {
                const level = m.value <= 30 ? 'LOW' : m.value <= 60 ? 'MEDIUM' : 'HIGH';
                return (
                  <div key={i} style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>{m.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: getLevelColor(level) }}>{m.value}</div>
                      <div style={{ flex: 1 }}>
                        <div className="score-meter">
                          <div className="score-meter-fill" style={{ width: `${m.value}%`, background: getLevelColor(level) }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>out of 100</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk scores list */}
          {riskScores.length === 0 ? (
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🔬</div>
                <div className="empty-state-title">No Risk Analyses Yet</div>
                <div className="empty-state-desc">Go to "Analyze Deployment" tab to run the risk scoring engine on your deployments.</div>
                <button className="btn btn-primary" onClick={() => setTab('analyze')}>
                  🔬 Start Analyzing
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="table-header">
                <div className="table-title">🔍 Risk Score Report</div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('analyze')}>+ Analyze New</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Environment</th>
                    <th>Risk Score</th>
                    <th>Level</th>
                    <th>Failure Prob.</th>
                    <th>Top Factor</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {riskScores.map(r => {
                    const topFactor = (r.factors || []).filter(f => f.triggered).sort((a, b) => b.contribution - a.contribution)[0];
                    return (
                      <tr key={r.id} className="risk-table-row" onClick={() => { setSelectedRisk(r); setTab('detail'); }}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.applicationName}</div>
                          <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.deploymentUniqueId}</code>
                        </td>
                        <td><span className={`badge env-${r.environment}`}>{r.environment}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 7, borderRadius: 'var(--radius-full)', background: 'var(--bg-input)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${r.score}%`, borderRadius: 'var(--radius-full)', background: getLevelColor(r.riskLevel) }} />
                            </div>
                            <span style={{ fontWeight: 800, color: getLevelColor(r.riskLevel), fontSize: '0.95rem' }}>{r.score}</span>
                          </div>
                        </td>
                        <td><span className={`risk-badge-lg risk-${r.riskLevel}`}>{r.riskCategory}</span></td>
                        <td style={{ fontWeight: 600, color: getLevelColor(r.riskLevel) }}>{r.failureProbability}%</td>
                        <td>
                          {topFactor ? (
                            <span className={`severity-chip severity-${topFactor.severity}`}>
                              {topFactor.name}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => { setSelectedRisk(r); setTab('detail'); }}>
                              Details
                            </button>
                            <button className="btn btn-sm" disabled={analyzing === r.deploymentId}
                              style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.3)' }}
                              onClick={() => handleAnalyze(r.deploymentId)}>
                              {analyzing === r.deploymentId ? <div className="spinner" /> : '🔄'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
