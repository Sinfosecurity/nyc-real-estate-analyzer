import { PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { money, pct, pctPoints, ratio } from '../utils/format';

export function StressPage() {
  const { analysis, deal } = useDeal();
  const rows = analysis.stressTests ?? [];
  const target = deal.assumptions.targetDscr;

  return (
    <div className="stack">
      <PageHeader eyebrow="Break points" title="Stress testing">
        <p className="muted">
          Combined shocks against the same engine. Green cash flow or DSCR is not a pass on legal
          occupancy.
        </p>
      </PageHeader>
      <Panel title="Stress cases">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th className="num">NOI</th>
                <th className="num">DSCR</th>
                <th className="num">Cash flow</th>
                <th className="num">CoC</th>
                <th>CF &gt; 0</th>
                <th>DSCR ≥ target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.noi ?? 0)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{pct(row.cashOnCash)}</td>
                  <td className={row.cashFlow > 0 ? 'status-good' : 'status-bad'}>
                    {row.cashFlow > 0 ? 'Yes' : 'No'}
                  </td>
                  <td className={row.dscr === null || row.dscr >= target ? 'status-good' : 'status-bad'}>
                    {row.dscr === null ? 'N/A (no debt)' : row.dscr >= target ? 'Yes' : 'Below'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Break-point analysis">
        <table>
          <tbody>
            {(analysis.breakpoints ?? []).map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="num">
                  {row.value === null ? 'N/A' : row.unit === '%' ? pctPoints(row.value) : money(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
