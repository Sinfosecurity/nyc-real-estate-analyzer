import { CheckField, NumberField } from '../components/fields';
import { FormulaBlock, MetricCard } from '../components/MetricCard';
import { Banner, FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { calculateRefinance } from '../calculations/valueAdd';
import { useDeal } from '../hooks/useDeal';
import { money, pct, ratio } from '../utils/format';

export function RefinancePage() {
  const { deal, analysis, updateDeal } = useDeal();
  const r = deal.refinance;
  const patch = (partial: Partial<typeof r>) =>
    updateDeal((c) => ({ ...c, refinance: { ...c.refinance, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="BRRRR / recapitalization" title="Refinance">
        <p className="muted">
          Maximum refinance loan = expected ARV × refinance LTV. Cash left in deal = original cash
          invested minus cash taken out at refinance.
        </p>
      </PageHeader>
      {analysis.refinance.exceedsConfiguredLtv ? (
        <Banner tone="danger">The modeled refinance loan exceeds the configured refinance LTV.</Banner>
      ) : null}
      <Panel title="Refinance inputs">
        <CheckField label="Model a refinance for this deal" checked={r.enabled} onChange={(enabled) => patch({ enabled })} />
        <FormGrid>
          <div className="field">
            <span className="field-label">Purchase price</span>
            <strong>{money(deal.loan.purchasePrice)}</strong>
            <span className="field-hint">From the financing module.</span>
          </div>
          <div className="field">
            <span className="field-label">Renovation in basis</span>
            <strong>{money(deal.renovation.renovationCost || deal.acquisition.renovationBudget)}</strong>
            <span className="field-hint">From renovation / acquisition.</span>
          </div>
          <NumberField label="Additional basis ($)" value={r.additionalBasis} onChange={(additionalBasis) => patch({ additionalBasis })} />
          <NumberField
            label="Post-renovation NOI ($ / year, 0 = use renovation module)"
            value={r.postRenovationNoi ?? 0}
            onChange={(postRenovationNoi) => patch({ postRenovationNoi: postRenovationNoi > 0 ? postRenovationNoi : null })}
          />
          <NumberField label="Expected ARV ($)" value={r.expectedArv} onChange={(expectedArv) => patch({ expectedArv })} />
          <NumberField label="Refinance LTV (%)" value={r.refinanceLtv} max={100} step={0.1} onChange={(refinanceLtv) => patch({ refinanceLtv })} />
          <NumberField label="Refinance rate (%)" value={r.refinanceRate} step={0.01} onChange={(refinanceRate) => patch({ refinanceRate })} />
          <NumberField label="Refinance amortization (years)" value={r.refinanceAmortizationYears} min={1} onChange={(refinanceAmortizationYears) => patch({ refinanceAmortizationYears })} />
          <NumberField label="Refinance closing costs ($)" value={r.refinanceCosts} onChange={(refinanceCosts) => patch({ refinanceCosts })} />
          <NumberField
            label="Old debt payoff override ($), 0 = current loan"
            value={r.currentLoanBalanceOverride ?? 0}
            onChange={(v) => patch({ currentLoanBalanceOverride: v > 0 ? v : null })}
          />
        </FormGrid>
      </Panel>
      <Panel title="Refinance results">
        <MetricGrid>
          <MetricCard label="Total basis" value={money(analysis.refinance.totalBasis)} />
          <MetricCard label="Maximum refinance loan" value={money(analysis.refinance.maxRefinanceLoan)} />
          <MetricCard label="Old debt payoff" value={money(analysis.refinance.oldDebtPayoff)} />
          <MetricCard label="Cash available from refinance" value={money(analysis.refinance.cashFromRefinance)} tone="emphasis" />
          <MetricCard label="Remaining equity" value={money(analysis.refinance.remainingEquity)} />
          <MetricCard label="Cash left in deal" value={money(analysis.refinance.cashLeftInDeal)} />
          <MetricCard label="Post-refi DSCR" value={ratio(analysis.refinance.postRefiDscr)} />
          <MetricCard label="Post-refi cash flow" value={money(analysis.refinance.postRefiCashFlow)} />
          <MetricCard label="Post-refi CoC" value={pct(analysis.refinance.postRefiCashOnCash)} />
          <MetricCard label="Post-refi monthly P&I" value={money(analysis.refinance.postRefiMonthlyPayment)} />
        </MetricGrid>
        {analysis.refinance.traces.map((trace) => (
          <FormulaBlock key={trace.title} trace={trace} />
        ))}
      </Panel>
      <Panel title="Refinance sensitivity (ARV / rate / LTV)">
        <p className="muted">
          Each cell is cash returned at refinance using the current purchase, basis, and payoff
          assumptions. Not a lender quote.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th className="num">Max loan</th>
                <th className="num">Cash from refi</th>
                <th className="num">Cash left</th>
                <th className="num">Post-refi DSCR</th>
                <th className="num">Post-refi CF</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'ARV −10%', arv: r.expectedArv * 0.9, rate: r.refinanceRate, ltv: r.refinanceLtv },
                { label: 'Base ARV / rate / LTV', arv: r.expectedArv, rate: r.refinanceRate, ltv: r.refinanceLtv },
                { label: 'ARV +10%', arv: r.expectedArv * 1.1, rate: r.refinanceRate, ltv: r.refinanceLtv },
                { label: 'Rate +1%', arv: r.expectedArv, rate: r.refinanceRate + 1, ltv: r.refinanceLtv },
                { label: 'LTV −5 pts', arv: r.expectedArv, rate: r.refinanceRate, ltv: r.refinanceLtv - 5 },
              ].map((caseRow) => {
                const row = calculateRefinance({
                  purchasePrice: deal.loan.purchasePrice,
                  renovation: deal.renovation.renovationCost || deal.acquisition.renovationBudget,
                  additionalBasis: r.additionalBasis,
                  buyerClosingCosts: analysis.buyerClosingCosts,
                  totalCashInvested: analysis.totalCashInvested,
                  postRenovationNoi: r.postRenovationNoi ?? (analysis.renovation.projectedNoi || analysis.noi),
                  expectedArv: caseRow.arv,
                  refinanceLtvPercent: caseRow.ltv,
                  refinanceRate: caseRow.rate,
                  refinanceAmortizationYears: r.refinanceAmortizationYears,
                  refinanceCosts: r.refinanceCosts,
                  oldDebtPayoff: r.currentLoanBalanceOverride ?? analysis.loanAmount,
                });
                return (
                  <tr key={caseRow.label}>
                    <td>{caseRow.label}</td>
                    <td className="num">{money(row.maxRefinanceLoan)}</td>
                    <td className="num">{money(row.cashFromRefinance)}</td>
                    <td className="num">{money(row.cashLeftInDeal)}</td>
                    <td className="num">{ratio(row.postRefiDscr)}</td>
                    <td className="num">{money(row.postRefiCashFlow)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
