import { TextField } from '../components/fields';
import { PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { createId } from '../utils/id';
import { money, pct, ratio } from '../utils/format';
import { useState } from 'react';

export function HistoryPage() {
  const { deal, analysis, updateDeal } = useDeal();
  const [label, setLabel] = useState('Listing analysis');
  const [notes, setNotes] = useState('');
  const snapshots = deal.snapshots ?? [];

  const saveSnapshot = () => {
    updateDeal((c) => ({
      ...c,
      snapshots: [
        ...(c.snapshots ?? []),
        {
          id: createId('snap'),
          versionLabel: label || 'Snapshot',
          createdAt: new Date().toISOString(),
          notes,
          purchasePrice: analysis.purchasePrice,
          noi: analysis.noi,
          capRate: analysis.capRate,
          dscr: analysis.dscr,
          cashFlow: analysis.cashFlowAnnual,
          cashOnCash: analysis.cashOnCash,
          maxOffer: analysis.maxOffer.conservative,
          signal: analysis.health.signal,
        },
      ],
    }));
    setNotes('');
  };

  return (
    <div className="stack">
      <PageHeader eyebrow="Underwriting versions" title="Deal history">
        <p className="muted">Save a snapshot when assumptions change: broker numbers, inspection, lender quote, final offer.</p>
      </PageHeader>
      <Panel title="Save current snapshot">
        <div className="form-grid cols-2">
          <TextField label="Version label" value={label} onChange={setLabel} />
          <TextField label="Notes" value={notes} onChange={setNotes} />
        </div>
        <button type="button" style={{ marginTop: 10 }} onClick={saveSnapshot}>
          Save snapshot
        </button>
      </Panel>
      <Panel title="Comparison">
        {snapshots.length === 0 ? <p className="empty-note">No snapshots yet.</p> : null}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th className="num">Price</th>
                <th className="num">NOI</th>
                <th className="num">Cap</th>
                <th className="num">DSCR</th>
                <th className="num">CF</th>
                <th className="num">CoC</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((row) => (
                <tr key={row.id}>
                  <td>{row.versionLabel}</td>
                  <td>{row.createdAt.slice(0, 10)}</td>
                  <td className="num">{money(row.purchasePrice)}</td>
                  <td className="num">{money(row.noi)}</td>
                  <td className="num">{pct(row.capRate)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{pct(row.cashOnCash)}</td>
                  <td>{row.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
