import { useEffect, useState } from 'react';
import T from '../../theme';
import { btnPrimary, btnSecondary } from '../../ui/styles';

const API_BASE = '/api';

export default function RollbackModal({ version, cluster, onClose, onRollback, onNotify }) {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetVersion, setTargetVersion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/helm-releases/${version}/rollback-options?cluster=${cluster}`)
      .then((r) => r.json())
      .then((data) => {
        setOptions(data);
        setTargetVersion(data.previousVersion || '');
      })
      .catch((err) => onNotify(err.message, true))
      .finally(() => setLoading(false));
  }, [version, cluster, onNotify]);

  const runRollback = async (mode, target) => {
    setSubmitting(true);
    try {
      const params = new URLSearchParams({ cluster, mode });
      if (target) params.set('targetVersion', target);
      const response = await fetch(
        `${API_BASE}/helm-releases/${version}/rollback?${params.toString()}`,
        { method: 'POST' }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Rollback failed');
      }
      onNotify(payload.message || 'Rollback triggered');
      onRollback();
      onClose();
    } catch (err) {
      onNotify(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const available = options?.availableVersions || [];
  const others = available.filter((v) => v.version !== version);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: 28, width: 520, maxHeight: '85vh', overflowY: 'auto',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, color: T.text }}>Rollback v{version}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textMuted }}>
          Cluster: {cluster.toUpperCase()}
        </p>

        {loading && <div style={{ color: T.textMuted, fontSize: 13 }}>Loading rollback options...</div>}

        {!loading && options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: T.bgSurface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                Redeploy older version
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>
                Re-runs Helm with an existing values-vX.yaml from the repo.
              </div>
              <select
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 14,
                  background: T.bgCard, color: T.text, border: `1px solid ${T.border}`,
                  marginBottom: 10,
                }}
              >
                <option value="">Select version...</option>
                {others.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}{v.releaseName ? ` (${v.releaseName})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => runRollback('version', targetVersion)}
                disabled={!targetVersion || submitting}
                style={{ ...btnPrimary, width: '100%', opacity: !targetVersion ? 0.6 : 1 }}
              >
                Roll back to selected version
              </button>
              {options.previousVersion && (
                <button
                  onClick={() => runRollback('version', options.previousVersion)}
                  disabled={submitting}
                  style={{ ...btnSecondary, width: '100%', marginTop: 8 }}
                >
                  Quick rollback to v{options.previousVersion}
                </button>
              )}
            </div>

            {options.canHelmRevisionRollback && (
              <div style={{
                background: T.bgSurface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  Helm revision rollback
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>
                  Undo the last Helm upgrade for this release (helm rollback).
                </div>
                <button
                  onClick={() => runRollback('revision')}
                  disabled={submitting}
                  style={{ ...btnSecondary, width: '100%', color: T.yellow, borderColor: `${T.yellow}55` }}
                >
                  Undo last Helm revision for v{version}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary} disabled={submitting}>Close</button>
        </div>
      </div>
    </div>
  );
}
