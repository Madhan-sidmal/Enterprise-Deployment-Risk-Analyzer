import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deploymentService from '../services/deployment.service';
import '../styles/deployments.css';

const ENVIRONMENTS = ['DEVELOPMENT', 'STAGING', 'UAT', 'PRODUCTION'];
const ENV_ICONS = { DEVELOPMENT: '💻', STAGING: '🔬', UAT: '🧪', PRODUCTION: '🚀' };

const INITIAL_FORM = {
  applicationName: '',
  version: '',
  environment: 'DEVELOPMENT',
  deploymentDate: '',
  deploymentDescription: '',
  modifiedFilesCount: 0,
  hasCriticalConfigChange: false,
  hasDependencyConflict: false,
  previousFailureCount: 0,
};

const CreateDeployment = () => {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isEdit) {
      deploymentService.getById(id)
        .then(d => {
          setForm({
            applicationName: d.applicationName,
            version: d.version,
            environment: d.environment,
            deploymentDate: d.deploymentDate,
            deploymentDescription: d.deploymentDescription || '',
            modifiedFilesCount: d.modifiedFilesCount || 0,
            hasCriticalConfigChange: d.hasCriticalConfigChange || false,
            hasDependencyConflict: d.hasDependencyConflict || false,
            previousFailureCount: d.previousFailureCount || 0,
          });
        })
        .catch(() => setServerError('Failed to load deployment'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.applicationName.trim()) e.applicationName = 'Application name is required';
    if (!form.version.trim()) e.version = 'Version is required';
    if (!form.environment) e.environment = 'Environment is required';
    if (!form.deploymentDate) e.deploymentDate = 'Deployment date is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        modifiedFilesCount: parseInt(form.modifiedFilesCount) || 0,
        previousFailureCount: parseInt(form.previousFailureCount) || 0,
      };
      if (isEdit) {
        await deploymentService.update(id, payload);
      } else {
        await deploymentService.create(payload);
      }
      navigate('/deployments');
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Failed to save deployment');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/deployments')}
            style={{ marginBottom: 'var(--space-2)', padding: '0.3rem 0.75rem', gap: '0.4rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isEdit ? '✏️ Edit Deployment' : '📦 New Deployment'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {isEdit ? 'Update deployment details (only DRAFT deployments can be edited)' : 'Fill in the details for your new deployment package'}
          </p>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <div className="form-section-title">📋 Basic Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="applicationName">Application Name *</label>
              <input id="applicationName" type="text" name="applicationName" className="form-input"
                placeholder="e.g. Payment Service, User API" value={form.applicationName} onChange={handleChange} />
              {errors.applicationName && <span className="form-error">{errors.applicationName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="version">Version *</label>
              <input id="version" type="text" name="version" className="form-input"
                placeholder="e.g. 2.4.1, 1.0.0-beta" value={form.version} onChange={handleChange} />
              {errors.version && <span className="form-error">{errors.version}</span>}
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">Target Environment *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {ENVIRONMENTS.map(env => (
                  <label key={env} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1px solid ${form.environment === env ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: form.environment === env ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="environment" value={env}
                      checked={form.environment === env} onChange={handleChange}
                      style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.3rem' }}>{ENV_ICONS[env]}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      color: form.environment === env ? 'var(--primary-light)' : 'var(--text-secondary)'
                    }}>{env}</span>
                  </label>
                ))}
              </div>
              {errors.environment && <span className="form-error">{errors.environment}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deploymentDate">Deployment Date *</label>
              <input id="deploymentDate" type="date" name="deploymentDate" className="form-input"
                value={form.deploymentDate} onChange={handleChange}
                style={{ colorScheme: 'dark' }} />
              {errors.deploymentDate && <span className="form-error">{errors.deploymentDate}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-5)' }}>
            <label className="form-label" htmlFor="deploymentDescription">Deployment Description</label>
            <textarea id="deploymentDescription" name="deploymentDescription" className="form-input"
              placeholder="Describe what this deployment includes — features, bug fixes, hotfixes, etc."
              value={form.deploymentDescription} onChange={handleChange}
              rows={4}
              style={{ resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>

        {/* Risk Factors */}
        <div className="form-section">
          <div className="form-section-title">⚠️ Risk Factors</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
            These inputs help the Risk Scoring Engine (Phase 3) calculate an accurate risk score.
          </p>

          <div className="form-grid" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="modifiedFilesCount">Number of Modified Files</label>
              <input id="modifiedFilesCount" type="number" name="modifiedFilesCount" className="form-input"
                min={0} placeholder="0"
                value={form.modifiedFilesCount} onChange={handleChange} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                &gt; 20 files adds +20 to risk score
              </span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="previousFailureCount">Previous Failure Count</label>
              <input id="previousFailureCount" type="number" name="previousFailureCount" className="form-input"
                min={0} placeholder="0"
                value={form.previousFailureCount} onChange={handleChange} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Any previous failures add +10 to risk score
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label className={`risk-toggle ${form.hasCriticalConfigChange ? 'checked' : ''}`}>
              <input type="checkbox" name="hasCriticalConfigChange"
                checked={form.hasCriticalConfigChange} onChange={handleChange} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  🔧 Critical Configuration Change
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  DB connection strings, API keys, security settings, infrastructure config — adds +30 to risk score
                </div>
              </div>
            </label>

            <label className={`risk-toggle ${form.hasDependencyConflict ? 'checked' : ''}`}>
              <input type="checkbox" name="hasDependencyConflict"
                checked={form.hasDependencyConflict} onChange={handleChange} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  🔗 Known Dependency Conflict
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Version mismatches or circular dependency detected — adds +15 to risk score
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary"
            onClick={() => navigate('/deployments')}>
            Cancel
          </button>
          <button id="save-deployment-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <><div className="spinner" /> Saving...</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {isEdit ? 'Save Changes' : 'Create Deployment'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeployment;
