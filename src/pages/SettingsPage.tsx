import { useMemo, useState } from 'react';
import { CheckField, NumberField, TextAreaField, TextField } from '../components/fields';
import { GlossaryTip } from '../components/MetricCard';
import { Banner, FormGrid, PageHeader, Panel } from '../components/ui';
import { GLOSSARY } from '../constants/glossary';
import { useDeal } from '../hooks/useDeal';
import { exportBackupReminderDue } from '../storage/localRepository';

export function SettingsPage() {
  const {
    deal,
    deals,
    updateDeal,
    showCalculations,
    setShowCalculations,
    createNew,
    duplicate,
    remove,
    rename,
    load,
    resetExample,
    exportJson,
    importJsonText,
  } = useDeal();
  const [query, setQuery] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [renameValue, setRenameValue] = useState(deal.name);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((entry) =>
      `${entry.acronym} ${entry.name} ${entry.explanation} ${entry.formula}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="stack">
      {exportBackupReminderDue(localStorage.getItem('nyc-deal-analyzer.last-export') ?? undefined) ? (
        <Banner tone="warn">
          Automatic backup reminder: export a JSON copy of this deal. localStorage can be cleared
          by the browser. Export weekly.
        </Banner>
      ) : null}
      <PageHeader eyebrow="Workspace" title="Settings & glossary">
        <p className="muted">
          Beta testing: Deal data is currently stored in this browser unless otherwise indicated.
          Saved deals are not synced to a cloud account and are not visible to other testers.
        </p>
      </PageHeader>

      <Panel title="Display">
        <CheckField
          label="Show calculation on every major metric"
          checked={showCalculations}
          onChange={setShowCalculations}
        />
      </Panel>

      <Panel title="Saved deals" actions={<button type="button" onClick={createNew}>New deal</button>}>
        <ul style={{ paddingLeft: 18 }}>
          {deals.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.name}</strong>{' '}
              <span className="muted small">{item.property.address || 'No address'}</span>{' '}
              <button type="button" className="text-btn" onClick={() => load(item.id)}>
                Open
              </button>
              {' · '}
              <button type="button" className="text-btn" onClick={() => remove(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        <FormGrid>
          <TextField label="Rename current deal" value={renameValue} onChange={setRenameValue} />
        </FormGrid>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => rename(renameValue)}>Save name</button>
          <button type="button" className="secondary" onClick={duplicate}>Duplicate current</button>
          <button type="button" className="secondary" onClick={exportJson}>Export JSON</button>
          <button type="button" className="secondary" onClick={resetExample}>Reset example fixture</button>
        </div>
      </Panel>

      <Panel title="Import deal JSON">
        <TextAreaField label="Paste exported JSON" value={importText} onChange={setImportText} rows={6} />
        <button
          type="button"
          onClick={() => {
            try {
              importJsonText(importText);
              setImportText('');
              setImportError('');
            } catch (error) {
              setImportError(error instanceof Error ? error.message : 'Invalid JSON import.');
            }
          }}
        >
          Import
        </button>
        {importError ? <p className="status-bad">{importError}</p> : null}
      </Panel>

      <Panel title="Investor notes">
        <TextAreaField
          label="Notes stored with this deal"
          value={deal.investorNotes}
          onChange={(investorNotes) => updateDeal((c) => ({ ...c, investorNotes }))}
        />
      </Panel>

      <Panel title="User underwriting targets" intro="These are your targets, not lender requirements.">
        <FormGrid>
          <NumberField
            label="Target cap rate (%)"
            value={deal.assumptions.targetCapRate}
            step={0.1}
            onChange={(targetCapRate) =>
              updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, targetCapRate } }))
            }
          />
          <NumberField
            label="User DSCR target"
            value={deal.assumptions.targetDscr}
            step={0.01}
            onChange={(targetDscr) =>
              updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, targetDscr } }))
            }
          />
          <NumberField
            label="Minimum CoC (%)"
            value={deal.assumptions.minCashOnCash}
            step={0.1}
            onChange={(minCashOnCash) =>
              updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, minCashOnCash } }))
            }
          />
          <NumberField
            label="Maximum LTV (%)"
            value={deal.assumptions.maxLtv}
            max={100}
            step={0.1}
            onChange={(maxLtv) => updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, maxLtv } }))}
          />
        </FormGrid>
      </Panel>

      <Panel title="Key acronyms & financial terms">
        <TextField label="Search glossary" value={query} onChange={setQuery} placeholder="DSCR, cap rate, CO…" />
        <div className="glossary-grid" style={{ marginTop: 12 }}>
          {filtered.map((entry) => (
            <GlossaryTip key={entry.id} entry={entry} variant="light" />
          ))}
        </div>
        <div className="flow-strip">GRI → Vacancy / Collection → EGI → OpEx → NOI → Debt Service → Cash Flow → CoC</div>
      </Panel>

      <Banner tone="info">
        This application is for screening and education. It is not legal, tax, lending, appraisal,
        or investment advice.
      </Banner>
    </div>
  );
}
