import { useMemo, useState } from 'react';
import { analyzeDeal } from '../calculations/analyze';
import { PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { DealAnalysis } from '../models';
import { money, pct, ratio } from '../utils/format';

type MetricKey =
  | 'price'
  | 'pricePerUnit'
  | 'pricePerSqft'
  | 'gri'
  | 'noi'
  | 'capRate'
  | 'dscr'
  | 'cashFlow'
  | 'coc'
  | 'debtYield'
  | 'cashRequired'
  | 'targetCapValue'
  | 'maxOffer';

const COLUMNS: { key: MetricKey; label: string; better: 'high' | 'low' }[] = [
  { key: 'price', label: 'Price', better: 'low' },
  { key: 'pricePerUnit', label: 'Price / unit', better: 'low' },
  { key: 'pricePerSqft', label: 'Price / sq ft', better: 'low' },
  { key: 'gri', label: 'GRI', better: 'high' },
  { key: 'noi', label: 'NOI', better: 'high' },
  { key: 'capRate', label: 'Cap Rate', better: 'high' },
  { key: 'dscr', label: 'DSCR', better: 'high' },
  { key: 'cashFlow', label: 'Cash Flow', better: 'high' },
  { key: 'coc', label: 'CoC', better: 'high' },
  { key: 'debtYield', label: 'Debt Yield', better: 'high' },
  { key: 'cashRequired', label: 'Cash required', better: 'low' },
  { key: 'targetCapValue', label: 'Value @ target cap', better: 'high' },
  { key: 'maxOffer', label: 'Max offer', better: 'high' },
];

function rowMetrics(analysis: DealAnalysis) {
  return {
    price: analysis.purchasePrice,
    pricePerUnit: analysis.pricePerUnit,
    pricePerSqft: analysis.pricePerSqft,
    gri: analysis.gri,
    noi: analysis.noi,
    capRate: analysis.capRate,
    dscr: analysis.dscr,
    cashFlow: analysis.cashFlowAnnual,
    coc: analysis.cashOnCash,
    debtYield: analysis.debtYield,
    cashRequired: analysis.totalCashInvested,
    targetCapValue: analysis.supportedValue,
    maxOffer: analysis.maxOffer.conservative,
  };
}

function formatMetric(key: MetricKey, value: number | null) {
  if (['capRate', 'coc', 'debtYield'].includes(key)) return pct(value);
  if (key === 'dscr') return ratio(value);
  return money(value);
}

export function ComparisonPage() {
  const { deals, deal, load } = useDeal();
  const [selected, setSelected] = useState<string[]>(() => deals.slice(0, 3).map((d) => d.id));
  const [sortKey, setSortKey] = useState<MetricKey>('capRate');

  const rows = useMemo(() => {
    return deals
      .filter((item) => selected.includes(item.id))
      .map((item) => ({ deal: item, metrics: rowMetrics(analyzeDeal(item)) }))
      .sort((a, b) => {
        const col = COLUMNS.find((c) => c.key === sortKey)!;
        const av = a.metrics[sortKey] ?? (col.better === 'high' ? -Infinity : Infinity);
        const bv = b.metrics[sortKey] ?? (col.better === 'high' ? -Infinity : Infinity);
        return col.better === 'high' ? Number(bv) - Number(av) : Number(av) - Number(bv);
      });
  }, [deals, selected, sortKey]);

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  return (
    <div className="stack">
      <PageHeader eyebrow="Portfolio view" title="Comparison">
        <p className="muted">Select saved deals and rank them by any underwriting metric.</p>
      </PageHeader>
      <Panel title="Saved deals">
        {deals.map((item) => (
          <label className="check-field" key={item.id}>
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
            <span>
              <strong>{item.name}</strong>
              <em>
                {item.property.address || 'No address'} {item.id === deal.id ? '· current' : ''}
              </em>
            </span>
          </label>
        ))}
      </Panel>
      <Panel
        title="Comparison table"
        actions={
          <label className="field" style={{ minWidth: 220 }}>
            <span className="field-label">Rank by</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as MetricKey)}>
              {COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Deal</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="num">
                    <button type="button" className="text-btn" onClick={() => setSortKey(col.key)}>
                      {col.label}
                    </button>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.deal.id}>
                  <td>
                    #{index + 1} {row.deal.name}
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="num">
                      {formatMetric(col.key, row.metrics[col.key])}
                    </td>
                  ))}
                  <td>
                    <button type="button" className="secondary" onClick={() => load(row.deal.id)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
