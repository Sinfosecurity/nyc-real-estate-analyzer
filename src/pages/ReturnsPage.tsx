import { FormulaBlock, MetricCard } from '../components/MetricCard';
import { MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { money, pct, ratio } from '../utils/format';

export function ReturnsPage() {
  const { analysis, deal } = useDeal();

  return (
    <div className="stack">
      <PageHeader eyebrow="Cash and coverage" title="Returns">
        <p className="muted">
          Cash flow is NOI minus debt service. Cash-on-cash uses total cash invested, not just the
          down payment.
        </p>
      </PageHeader>
      <Panel title="Return metrics">
        <MetricGrid>
          <MetricCard label="NOI" value={money(analysis.noi)} glossaryId="noi" trace={analysis.traces.noi} />
          <MetricCard label="Annual cash flow" value={money(analysis.cashFlowAnnual)} glossaryId="cashflow" trace={analysis.traces.cashFlow} />
          <MetricCard label="Monthly cash flow" value={money(analysis.cashFlowMonthly)} />
          <MetricCard label="Total cash invested" value={money(analysis.totalCashInvested)} glossaryId="tce" />
          <MetricCard label="Cash-on-cash return" value={pct(analysis.cashOnCash)} glossaryId="coc" trace={analysis.traces.coc} tone="emphasis" />
          <MetricCard label="DSCR" value={ratio(analysis.dscr)} glossaryId="dscr" trace={analysis.traces.dscr} />
          <MetricCard label="Debt yield" value={pct(analysis.debtYield)} glossaryId="debt-yield" trace={analysis.traces.debtYield} />
          <MetricCard label="Cap rate" value={pct(analysis.capRate)} glossaryId="caprate" trace={analysis.traces.capRate} />
          <MetricCard label="GRM" value={ratio(analysis.grm)} glossaryId="grm" />
          <MetricCard
            label={analysis.breakEvenMethodLabel ?? 'Break-even occupancy'}
            value={pct(analysis.breakEvenOccupancy)}
            glossaryId="beo"
          />
          <MetricCard label="Simplified break-even occupancy" value={pct(analysis.simplifiedBreakEvenOccupancy ?? null)} />
          <MetricCard label="Contribution-margin break-even" value={pct(analysis.contributionBreakEvenOccupancy ?? null)} />
          <MetricCard label="Break-even revenue" value={money(analysis.breakEvenRevenue)} />
          <MetricCard label="Margin above break-even" value={money(analysis.breakEvenMargin)} />
        </MetricGrid>
      </Panel>
      <div className="grid-2">
        <Panel title="Total cash invested">
          <table>
            <tbody>
              <tr><td>Down payment</td><td className="num">{money(analysis.downPayment)}</td></tr>
              <tr><td>Buyer closing costs</td><td className="num">{money(analysis.buyerClosingCosts)}</td></tr>
              <tr><td>Renovation budget</td><td className="num">{money(deal.acquisition.renovationBudget)}</td></tr>
              <tr><td>Financing fees (points + lender)</td><td className="num">{money(analysis.financingFees)}</td></tr>
              <tr><td>Initial reserves</td><td className="num">{money(deal.acquisition.initialReserves)}</td></tr>
              <tr><td>Total cash invested</td><td className="num">{money(analysis.totalCashInvested)}</td></tr>
            </tbody>
          </table>
          {analysis.traces.coc ? <FormulaBlock trace={analysis.traces.coc} /> : null}
        </Panel>
        <Panel title="Equity">
          <table>
            <tbody>
              <tr><td>Acquisition equity (price − loan)</td><td className="num">{money(analysis.equity.acquisitionEquity)}</td></tr>
              <tr><td>Year-1 principal paydown</td><td className="num">{money(analysis.equity.principalPaydownYear1)}</td></tr>
              <tr><td>Post-renovation equity</td><td className="num">{money(analysis.equity.postRenovationEquity)}</td></tr>
              <tr><td>Refinance equity</td><td className="num">{money(analysis.equity.refinanceEquity)}</td></tr>
              <tr>
                <td>Appreciated value (only if you set a rate)</td>
                <td className="num">{money(analysis.equity.appreciatedValue)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
