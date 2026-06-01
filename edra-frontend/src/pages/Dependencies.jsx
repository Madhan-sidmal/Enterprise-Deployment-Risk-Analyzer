import React, { useEffect, useState } from 'react';
import dependencyService from '../services/dependency.service';
import deploymentService from '../services/deployment.service';
import DependencyGraph from '../components/DependencyGraph';
import '../styles/deployments.css';

const ISSUE_ICONS = {
  MISSING_DEPENDENCY: '❌',
  CIRCULAR_DEPENDENCY: '🔄',
  VERSION_MISMATCH: '⚠️',
};

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  HIGH:     { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  MEDIUM:   { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  LOW:      { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
};

const EXAMPLE_GRAPH = {
  services: [
    { name: 'API Gateway',    version: '3.0.0' },
    { name: 'User Service',   version: '2.1.0' },
    { name: 'Order Service',  version: '1.5.0' },
    { name: 'Payment Service',version: '1.0.0' },
    { name: 'Notify Service', version: '1.2.0' },
  ],
  dependencies: [
    { from: 'API Gateway',    to: 'User Service',    requiredVersion: '^2.0.0' },
    { from: 'API Gateway',    to: 'Order Service',   requiredVersion: null },
    { from: 'Order Service',  to: 'Payment Service', requiredVersion: '2.0.0' },  // version mismatch
    { from: 'Order Service',  to: 'Notify Service',  requiredVersion: null },
    { from: 'Notify Service', to: 'Missing Service', requiredVersion: null },       // missing
  ],
};

const Dependencies = () => {
  const [tab, setTab] = useState('analyze');
  const [deployments, setDeployments] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [selectedDep, setSelectedDep] = useState('');
  const [services, setServices] = useState([{ name: '', version: '' }]);
  const [edges, setEdges] = useState([{ from: '', to: '', requiredVersion: '' }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      deploymentService.getAll().catch(() => []),
      dependencyService.getAll().catch(() => []),
    ]).then(([deps, reports]) => {
      setDeployments(deps);
      setAllReports(reports);
    }).finally(() => setFetchLoading(false));
  }, []);

  const loadExample = () => {
    setServices(EXAMPLE_GRAPH.services);
    setEdges(EXAMPLE_GRAPH.dependencies.map(e => ({ from: e.from, to: e.to, requiredVersion: e.requiredVersion || '' })));
  };

  const addService = () => setServices(prev => [...prev, { name: '', version: '' }]);
  const removeService = (i) => setServices(prev => prev.filter((_, idx) => idx !== i));
  const updateService = (i, field, val) => setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const addEdge = () => setEdges(prev => [...prev, { from: '', to: '', requiredVersion: '' }]);
  const removeEdge = (i) => setEdges(prev => prev.filter((_, idx) => idx !== i));
  const updateEdge = (i, field, val) => setEdges(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const handleAnalyze = async () => {
    if (!selectedDep) { setError('Please select a deployment'); return; }
    const validServices = services.filter(s => s.name.trim());
    const validEdges    = edges.filter(e => e.from.trim() && e.to.trim());
    if (validServices.length === 0) { setError('Add at least one service'); return; }

    setError('');
    setLoading(true);
    try {
      const data = await dependencyService.analyze({
        deploymentId: parseInt(selectedDep),
        services: validServices,
        dependencies: validEdges.map(e => ({ from: e.from, to: e.to, requiredVersion: e.requiredVersion || null })),
      });
      setResult(data);
      setAllReports(prev => [data, ...prev.filter(r => r.deploymentId !== data.deploymentId)]);
      setTab('result');
    } catch (err) {
      setError(err?.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const serviceNames = services.filter(s => s.name.trim()).map(s => s.name);

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>🌐 Dependency Analyzer</h1>
          <p>Detect missing dependencies, circular references, and version mismatches</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['analyze', 'result', 'history'].map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'analyze' ? '🔬 Analyze' : t === 'result' ? '📊 Result' : '📋 History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ANALYZE TAB ─────────────────────────────────── */}
      {tab === 'analyze' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Left: form */}
          <div>
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            {/* Deployment selector */}
            <div className="form-section">
              <div className="form-section-title">📦 Select Deployment</div>
              <div className="form-group">
                <select className="form-select" value={selectedDep} onChange={e => setSelectedDep(e.target.value)}>
                  <option value="">-- Choose a deployment --</option>
                  {deployments.map(d => (
                    <option key={d.id} value={d.id}>{d.applicationName} ({d.deploymentId})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Services */}
            <div className="form-section">
              <div className="form-section-title">🔵 Service Registry</div>
              {services.map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 32px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input className="form-input" placeholder="Service name" value={s.name}
                    onChange={e => updateService(i, 'name', e.target.value)} style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }} />
                  <input className="form-input" placeholder="v1.0.0" value={s.version}
                    onChange={e => updateService(i, 'version', e.target.value)} style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeService(i)}
                    style={{ padding: '0 0.6rem' }} disabled={services.length === 1}>✕</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addService} style={{ marginTop: 'var(--space-2)' }}>+ Add Service</button>
            </div>

            {/* Dependencies */}
            <div className="form-section">
              <div className="form-section-title">🔗 Dependencies</div>
              {edges.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 100px 32px', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <select className="form-select" value={e.from} onChange={ev => updateEdge(i, 'from', ev.target.value)}
                    style={{ padding: '0.6rem 0.6rem', fontSize: '0.82rem' }}>
                    <option value="">From</option>
                    {serviceNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 2px' }}>→</span>
                  <input className="form-input" placeholder="To service" value={e.to}
                    onChange={ev => updateEdge(i, 'to', ev.target.value)} style={{ padding: '0.6rem 0.6rem', fontSize: '0.82rem' }} />
                  <input className="form-input" placeholder="req ver" value={e.requiredVersion}
                    onChange={ev => updateEdge(i, 'requiredVersion', ev.target.value)} style={{ padding: '0.6rem 0.6rem', fontSize: '0.82rem' }} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeEdge(i)}
                    style={{ padding: '0 0.6rem' }} disabled={edges.length === 1}>✕</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addEdge} style={{ marginTop: 'var(--space-2)' }}>+ Add Dependency</button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={loadExample}>📥 Load Example</button>
              <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={loading} style={{ flex: 1 }}>
                {loading ? <><div className="spinner" /> Analyzing...</> : '🔬 Run Analysis'}
              </button>
            </div>
          </div>

          {/* Right: live graph preview */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
              🗺️ Live Dependency Graph Preview
            </div>
            <DependencyGraph
              nodes={services.filter(s => s.name).map(s => ({ id: s.name, label: s.name, version: s.version, hasIssue: false }))}
              edges={edges.filter(e => e.from && e.to).map(e => ({ from: e.from, to: e.to, requiredVersion: e.requiredVersion, hasConflict: !serviceNames.includes(e.to) }))}
            />
          </div>
        </div>
      )}

      {/* ── RESULT TAB ─────────────────────────────────── */}
      {tab === 'result' && result && (
        <div>
          {/* Header card */}
          <div style={{
            background: result.isHealthy ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${result.isHealthy ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {result.isHealthy ? '✅ Dependency Graph is Healthy' : '⚠️ Dependency Issues Detected'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                {result.applicationName} · {result.totalDependencies} dependencies · {result.issueCount} issue(s)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
              {[
                { label: 'Services', value: result.nodes?.length ?? 0, color: 'var(--primary-light)' },
                { label: 'Dependencies', value: result.totalDependencies, color: 'var(--accent)' },
                { label: 'Issues', value: result.issueCount, color: result.issueCount > 0 ? 'var(--danger)' : 'var(--success)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-6)' }}>
            {/* Graph */}
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
                🗺️ Dependency Graph
              </div>
              <DependencyGraph nodes={result.nodes || []} edges={result.edges || []} />
            </div>

            {/* Issues list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                🔍 Detected Issues ({result.issues?.length ?? 0})
              </div>
              {result.issues?.length === 0 ? (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', textAlign: 'center', color: 'var(--success)' }}>
                  ✅ No issues found! Dependency graph is clean.
                </div>
              ) : (
                result.issues.map((issue, i) => {
                  const sev = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.LOW;
                  return (
                    <div key={i} style={{ background: 'var(--gradient-card)', border: `1px solid ${sev.border}`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', borderLeft: `4px solid ${sev.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '1rem' }}>{ISSUE_ICONS[issue.issueType] || '⚡'}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {issue.issueType.replace(/_/g, ' ')}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: sev.bg, color: sev.color }}>
                          {issue.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                        {issue.description}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: sev.color, display: 'flex', gap: 4 }}>
                        <span>💡</span>
                        <span>{issue.resolution}</span>
                      </div>
                      {(issue.sourceService || issue.targetService) && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                          {issue.sourceService && <code style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', padding: '2px 7px', borderRadius: 4 }}>{issue.sourceService}</code>}
                          {issue.targetService && <><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                          <code style={{ fontSize: '0.72rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 7px', borderRadius: 4 }}>{issue.targetService}</code></>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="table-header">
            <div className="table-title">📋 Analysis History</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{allReports.length} reports</span>
          </div>
          {allReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌐</div>
              <div className="empty-state-title">No analyses yet</div>
              <div className="empty-state-desc">Run your first dependency analysis to see results here.</div>
              <button className="btn btn-primary" onClick={() => setTab('analyze')}>🔬 Start Analysis</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Dependencies</th>
                  <th>Issues</th>
                  <th>Health</th>
                  <th>Analyzed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allReports.map(r => (
                  <tr key={r.id} className="dep-row" onClick={() => { setResult(r); setTab('result'); }}>
                    <td style={{ fontWeight: 600 }}>{r.applicationName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.totalDependencies}</td>
                    <td>
                      {r.issueCount > 0
                        ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {r.issueCount} issue(s)</span>
                        : <span style={{ color: 'var(--success)' }}>✅ None</span>}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.7rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600,
                        background: r.isHealthy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: r.isHealthy ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${r.isHealthy ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}>
                        {r.healthStatus}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.analyzedByUsername}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {r.analyzedAt ? new Date(r.analyzedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'result' && !result && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No result yet</div>
          <div className="empty-state-desc">Run an analysis first to see results.</div>
          <button className="btn btn-primary" onClick={() => setTab('analyze')}>🔬 Go to Analyze</button>
        </div>
      )}
    </div>
  );
};

export default Dependencies;
