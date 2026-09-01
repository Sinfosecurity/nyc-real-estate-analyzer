import { NumberField } from '../components/fields';
import { FormulaBlock, MetricCard } from '../components/MetricCard';
import { FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { money, pct, pctPoints, ratio, signedMoney } from '../utils/format';

export function ValuationPage() {
  const { deal, analysis, updateDeal } = useDeal();
  const a = deal.assumptions;
  const patch = (partial: Partial<typeof a>) =>
    updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Price support" title="Valuation & maximum offer">
        <p className="muted">
          Targets below are user underwriting assumptions, not lender requirements. The conservative
          offer is the most restrictive applicable constraint.
        </p>
      </PageHeader>
      <Panel title="User underwriting targets">
        <FormGrid>
          <NumberField label="Target cap rate (%)" value={a.targetCapRate} step={0.1} onChange={(targetCapRate) => patch({ targetCapRate })} />
          <NumberField
            label="User DSCR target"
            value={a.targetDscr}
            step={0.01}
            onChange={(targetDscr) => patch({ targetDscr })}
            hint="Not labeled as a lender requirement."
          />
          <NumberField label="Minimum cash-on-cash (%)" value={a.minCashOnCash} step={0.1} onChange={(minCashOnCash) => patch({ minCashOnCash })} />
          <NumberField label="Maximum LTV (%)" value={a.maxLtv} max={100} step={0.1} onChange={(maxLtv) => patch({ maxLtv })} />
          <NumberField
            label="Required cash budget ($), 0 = none"
            value={a.maxCashToInvest ?? 0}
            onChange={(maxCashToInvest) => patch({ maxCashToInvest: maxCashToInvest > 0 ? maxCashToInvest : null })}
          />
        </FormGrid>
      </Panel>
      <Panel title="Cap rate valuation">
        <MetricGrid>
          <MetricCard label="Asking / purchase price" value={money(analysis.purchasePrice)} />
          <MetricCard
            label={`Value @ ${pctPoints(a.targetCapRate)} cap`}
            value={money(analysis.supportedValue)}
            glossaryId="caprate"
          />
          <MetricCard label="Dollar difference" value={signedMoney(analysis.askingVsValue)} />
          <MetricCard label="Percentage difference" value={pct(analysis.askingVsValuePct)} />
        </MetricGrid>
      </Panel>
      <Panel title="DSCR supportability">
        <MetricGrid>
          <MetricCard label="NOI" value={money(analysis.noi)} />
          <MetricCard label="User DSCR target" value={ratio(a.targetDscr)} />
          <MetricCard label="Maximum annual debt service" value={money(analysis.maxAnnualDebtService)} />
          <MetricCard label="Maximum supported loan" value={money(analysis.supportedLoan)} />
          <MetricCard label="Requested loan" value={money(analysis.loanAmount)} />
        </MetricGrid>
        <p className="muted">
          Maximum annual debt service = NOI ÷ user DSCR target. Supported loan is the amortizing
          principal that produces that payment at the current rate and amortization.
        </p>
      </Panel>
      <Panel title="Valuation triangulation">
        <p className="muted">
          Income approach uses NOI ÷ target cap. Sales comparison uses only comps you entered. The
          range is indicative, not an appraisal.
        </p>
        <table>
          <tbody>
            <tr><td>Income approach</td><td className="num">{money(analysis.valuationRange?.incomeApproach)}</td></tr>
            <tr>
              <td>Comparable sales range</td>
              <td className="num">
                {money(analysis.valuationRange?.salesLow)} – {money(analysis.valuationRange?.salesHigh)}
              </td>
            </tr>
            <tr>
              <td>Indicative underwriting range</td>
              <td className="num">
                {money(analysis.valuationRange?.indicativeLow)} – {money(analysis.valuationRange?.indicativeHigh)}
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>
      <Panel title="Offer price set">
        <FormGrid>
          <NumberField
            label="Asking price ($)"
            value={deal.offerPrices?.asking ?? deal.loan.purchasePrice}
            onChange={(asking) =>
              updateDeal((c) => ({ ...c, offerPrices: { asking, target: c.offerPrices?.target ?? 0, aggressive: c.offerPrices?.aggressive ?? 0, custom: c.offerPrices?.custom ?? asking } }))
            }
          />
          <NumberField
            label="Target offer ($)"
            value={deal.offerPrices?.target ?? 0}
            onChange={(target) =>
              updateDeal((c) => ({
                ...c,
                offerPrices: {
                  asking: c.offerPrices?.asking ?? c.loan.purchasePrice,
                  target,
                  aggressive: c.offerPrices?.aggressive ?? 0,
                  custom: c.offerPrices?.custom ?? c.loan.purchasePrice,
                },
              }))
            }
          />
          <NumberField
            label="Aggressive offer ($)"
            value={deal.offerPrices?.aggressive ?? 0}
            onChange={(aggressive) =>
              updateDeal((c) => ({
                ...c,
                offerPrices: {
                  asking: c.offerPrices?.asking ?? c.loan.purchasePrice,
                  target: c.offerPrices?.target ?? 0,
                  aggressive,
                  custom: c.offerPrices?.custom ?? c.loan.purchasePrice,
                },
              }))
            }
          />
          <NumberField
            label="Custom offer ($)"
            value={deal.offerPrices?.custom ?? 0}
            onChange={(custom) =>
              updateDeal((c) => ({
                ...c,
                offerPrices: {
                  asking: c.offerPrices?.asking ?? c.loan.purchasePrice,
                  target: c.offerPrices?.target ?? 0,
                  aggressive: c.offerPrices?.aggressive ?? 0,
                  custom,
                },
              }))
            }
          />
        </FormGrid>
      </Panel>
      <Panel title="Offer prices at asking / target / aggressive / custom">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Offer</th>
                <th className="num">P&I</th>
                <th className="num">DSCR</th>
                <th className="num">Cash flow</th>
                <th className="num">CoC</th>
                <th className="num">Cap rate</th>
              </tr>
            </thead>
            <tbody>
              {(analysis.offerRows ?? []).map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.monthlyPI)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{pct(row.cashOnCash)}</td>
                  <td className="num">{pct(row.capRate ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Maximum offer">
        <MetricGrid>
          <MetricCard label="By cap rate" value={money(analysis.maxOffer.byCapRate)} />
          <MetricCard label="By DSCR" value={money(analysis.maxOffer.byDscr)} />
          <MetricCard label="By cash-on-cash" value={money(analysis.maxOffer.byCashOnCash)} />
          <MetricCard label="By LTV" value={money(analysis.maxOffer.byLtv ?? null)} />
          <MetricCard label="By available cash" value={money(analysis.maxOffer.byAvailableCash ?? null)} />
          <MetricCard label="By renovation / basis" value={money(analysis.maxOffer.byRenovationBasis ?? null)} />
          <MetricCard label="By financing" value={money(analysis.maxOffer.byFinancing)} />
          <MetricCard
            label="Conservative maximum offer"
            value={money(analysis.maxOffer.conservative)}
            tone="emphasis"
          />
        </MetricGrid>
        <p>
          Binding constraint:{' '}
          <strong>{analysis.maxOffer.bindingConstraint ?? 'None'}</strong>. This is a screening
          ceiling, not a recommended bid.
        </p>
        {analysis.maxOffer.traces.map((trace) => (
          <FormulaBlock key={trace.title} trace={trace} />
        ))}
      </Panel>
    </div>
  );
}
