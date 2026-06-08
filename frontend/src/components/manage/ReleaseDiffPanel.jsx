import T from '../../theme';

const hasRecipeDiffs = (data) => {
  if (!data) return false;
  const keys = ['recipesAdded', 'recipesRemoved', 'recipesChanged'];
  return keys.some((k) => Array.isArray(data[k]) && data[k].length > 0);
};

const renderList = (items) => (
  <ul style={{ margin: 0, paddingLeft: 18, color: T.textMuted, fontSize: 12 }}>
    {items.map((text, i) => <li key={`${text}-${i}`}>{text}</li>)}
  </ul>
);

const renderRecipeSection = (title, items, formatter) => (
  <div style={{
    background: T.bgSurface, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '12px 16px',
  }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
      {title}
    </div>
    {items.length === 0 ? (
      <div style={{ fontSize: 12, color: T.textMuted }}>None</div>
    ) : (
      renderList(items.map(formatter))
    )}
  </div>
);

const renderChangedRecipes = (items) => (
  <div style={{
    background: T.bgSurface, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '12px 16px',
  }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>
      Recipes Changed
    </div>
    {items.length === 0 ? (
      <div style={{ fontSize: 12, color: T.textMuted }}>None</div>
    ) : (
      items.map((rec) => {
        const comp = rec.components || {};
        const up = rec.upgrade_to || {};
        const addedComps = comp.added ? Object.entries(comp.added).map(([k, v]) => `+ ${k}: ${v}`) : [];
        const removedComps = comp.removed ? Object.entries(comp.removed).map(([k, v]) => `- ${k}: ${v}`) : [];
        const changedComps = comp.changed
          ? Object.entries(comp.changed).map(([k, v]) => `~ ${k}: ${v.from} -> ${v.to}`)
          : [];
        const upAdded = Array.isArray(up.added) ? up.added.map((p) => `+ ${p}`) : [];
        const upRemoved = Array.isArray(up.removed) ? up.removed.map((p) => `- ${p}`) : [];

        return (
          <div key={rec.version} style={{
            borderTop: `1px dashed ${T.border}`,
            paddingTop: 10,
            marginTop: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 6 }}>
              Recipe v{rec.version}
            </div>
            {(addedComps.length + removedComps.length + changedComps.length) > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
                  Components
                </div>
                {renderList([...addedComps, ...removedComps, ...changedComps])}
              </div>
            )}
            {(upAdded.length + upRemoved.length) > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
                  Upgrade To
                </div>
                {renderList([...upAdded, ...upRemoved])}
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
);

export default function ReleaseDiffPanel({ diff, loading }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 20, color: T.textMuted }}>Loading preview...</div>;
  }

  if (!diff) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {diff.summary && (
        <div style={{
          background: `${T.blue}12`, border: `1px solid ${T.blue}33`,
          borderRadius: 10, padding: '12px 16px', fontSize: 13, color: T.text,
        }}>
          {diff.summary}
          {diff.baselineVersion && (
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
              Comparing v{diff.baselineVersion} to v{diff.targetVersion} on {diff.cluster?.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {diff.error && (
        <div style={{
          background: `${T.red}15`, border: `1px solid ${T.red}55`,
          borderRadius: 10, padding: '12px 16px', color: T.red, fontSize: 12,
        }}>
          {diff.error}
        </div>
      )}

      {!hasRecipeDiffs(diff) && !diff.error && !diff.isNewDeploy && (
        <div style={{
          background: T.bgSurface, border: `1px dashed ${T.border}`,
          borderRadius: 10, padding: '12px 16px',
          color: T.textMuted, fontSize: 12, textAlign: 'center',
        }}>
          No recipe differences found.
        </div>
      )}

      {renderRecipeSection(
        'Recipes Added',
        Array.isArray(diff.recipesAdded) ? diff.recipesAdded : [],
        (r) => `v${r.version}${r.description ? ` - ${r.description}` : ''}`
      )}
      {renderRecipeSection(
        'Recipes Removed',
        Array.isArray(diff.recipesRemoved) ? diff.recipesRemoved : [],
        (r) => `v${r.version}${r.description ? ` - ${r.description}` : ''}`
      )}
      {renderChangedRecipes(Array.isArray(diff.recipesChanged) ? diff.recipesChanged : [])}
    </div>
  );
}

export { hasRecipeDiffs };
