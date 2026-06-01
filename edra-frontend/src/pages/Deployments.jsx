import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import deploymentService from '../services/deployment.service';
import '../styles/deployments.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPLOYED: 'Deployed',
};

const ENV_ICONS = {
  DEVELOPMENT: '💻',
  STAGING: '🔬',
  UAT: '🧪',
  PRODUCTION: '🚀',
};

const FILTERS = ['ALL', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DEPLOYED'];

const Deployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    let result = deployments;
    if (activeFilter !== 'ALL') {
      result = result.filter(d => d.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.applicationName.toLowerCase().includes(q) ||
        d.deploymentId.toLowerCase().includes(q) ||
        d.version.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [deployments, activeFilter, search]);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const data = await deploymentService.getAll();
      setDeployments(data);
    } catch (err) {
      setError('Failed to load deployments.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this deployment?')) return;
    try {
      await deploymentService.remove(id);
      setDeployments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e, id) => {
    e.stopPropagation();
    try {
      const updated = await deploymentService.submitForReview(id);
      setDeployments(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      alert(err?.response?.data?.message || 'Submit failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Deployments</h1>
          <p>Manage and track all deployment packages</p>
        </div>
        <button
          id="create-deployment-btn"
          className="btn btn-primary"
          onClick={() => navigate('/deployments/new')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Deployment
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Filters + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}>
              {f === 'ALL' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="form-input-icon-wrap" style={{ width: 240 }}>
          <svg className="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" className="form-input" placeholder="Search deployments..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.55rem 0.9rem 0.55rem 2.5rem', fontSize: '0.85rem' }} />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No deployments found</div>
            <div className="empty-state-desc">
              {activeFilter !== 'ALL' || search
                ? 'No deployments match your current filters.'
                : 'Create your first deployment package to get started.'}
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/deployments/new')}>
              + New Deployment
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Deployment ID</th>
                <th>Application</th>
                <th>Version</th>
                <th>Environment</th>
                <th>Deploy Date</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dep => (
                <tr key={dep.id} className="dep-row"
                  onClick={() => navigate(`/deployments/${dep.id}`)}>
                  <td>
                    <code style={{ fontSize: '0.78rem', color: 'var(--primary-light)',
                      background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                      {dep.deploymentId}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dep.applicationName}</div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      v{dep.version}
                    </span>
                  </td>
                  <td>
                    <span className={`badge env-${dep.environment}`}>
                      {ENV_ICONS[dep.environment]} {dep.environment}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatDate(dep.deploymentDate)}
                  </td>
                  <td>
                    <span className={`badge status-${dep.status}`}>
                      {STATUS_LABELS[dep.status]}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {dep.createdByFullName || dep.createdByUsername}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      {dep.status === 'DRAFT' && (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
                            onClick={(e) => handleSubmit(e, dep.id)}
                            title="Submit for review"
                          >
                            Submit
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => { e.stopPropagation(); navigate(`/deployments/${dep.id}/edit`); }}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => handleDelete(e, dep.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {dep.status !== 'DRAFT' && (
                        <button className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/deployments/${dep.id}`)}>
                          View
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

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {filtered.length} of {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Deployments;
