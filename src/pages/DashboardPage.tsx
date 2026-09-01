import { MetricCard } from '../components/MetricCard';
import { Banner, MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { money, pct, pctPoints, ratio, signedMoney } from '../utils/format';

export function DashboardPage() {
  const { analysis, deal } = useDeal();
  const { health, traces } = analysis;

  return (
    <div className="stack">
      <PageHeader eyebrow="Primary deal summary" title="Underwriting desk">
        <p className="muted">
          Base-case results use legal, verified income only. This screen answers whether the
          property deserves further investigation — not whether to buy it.
        </p>
      </PageHeader>

      <Banner>
        Potential income is excluded from base-case underwriting until legal occupancy and
        permitted use are verified. Excluded annual amount:{' '}
        <strong>{money(analysis.unverifiedIncomeAnnual)}</strong>
      </Banner>
      {analysis.sourceConflicts && analysis.sourceConflicts.length > 0 ? (
        <Banner tone="danger">
          SOURCE CONFLICT — listing and official records disagree. Base-case underwriting will not
          choose silently.
          {analysis.sourceConflicts.map((c) => (
            <div key={c.field}>
              {c.field}: listing {c.listing} vs official {c.official}
            </div>
          ))}
        </Banner>
      ) : null}

      <Panel title="Headline metrics">
        <MetricGrid>
          <MetricCard label="What is the property?" value={deal.property.address || deal.name} />
          <MetricCard label="Asking / purchase price" value={money(analysis.purchasePrice)} />
          <MetricCard label="Legal monthly rent (base case)" value={money(analysis.gri / 12)} />
          <MetricCard
            label="Excluded / unverified income (annual)"
            value={money(analysis.unverifiedIncomeAnnual)}
            tone="warn"
          />
          <MetricCard label="GRI — Gross Rental Income" value={money(analysis.gri)} glossaryId="gri" trace={traces.gri} />
          <MetricCard label="EGI — Effective Gross Income" value={money(analysis.egi)} glossaryId="egi" trace={traces.egi} />
          <MetricCard label="NOI — Net Operating Income" value={money(analysis.noi)} glossaryId="noi" trace={traces.noi} tone="emphasis" />
          <MetricCard label="Cap Rate" value={pct(analysis.capRate)} glossaryId="caprate" trace={traces.capRate} />
          <MetricCard label="Loan Amount" value={money(analysis.loanAmount)} />
          <MetricCard label="LTV (÷ purchase price)" value={pct(analysis.ltv)} glossaryId="ltv" trace={traces.ltv} />
          <MetricCard label="Monthly P&I" value={money(analysis.monthlyPI)} glossaryId="pi" />
          <MetricCard label="Annual Debt Service" value={money(analysis.annualDebtService)} glossaryId="debt-service" />
          <MetricCard label="DSCR" value={ratio(analysis.dscr)} glossaryId="dscr" trace={traces.dscr} />
          <MetricCard label="Annual Cash Flow" value={money(analysis.cashFlowAnnual)} glossaryId="cashflow" trace={traces.cashFlow} />
          <MetricCard label="Monthly Cash Flow" value={money(analysis.cashFlowMonthly)} />
          <MetricCard label="Cash-on-Cash Return" value={pct(analysis.cashOnCash)} glossaryId="coc" trace={traces.coc} />
          <MetricCard label="Debt Yield" value={pct(analysis.debtYield)} glossaryId="debt-yield" trace={traces.debtYield} />
          <MetricCard label="Total Cash Required" value={money(analysis.totalCashInvested)} glossaryId="tce" />
          <MetricCard label="Value @ Target Cap" value={money(analysis.supportedValue)} />
          <MetricCard
            label="Conservative Maximum Offer"
            value={money(analysis.maxOffer.conservative)}
            tone="emphasis"
          />
          <MetricCard label="Price vs Target-Cap Value" value={signedMoney(analysis.askingVsValue)} />
          <MetricCard
            label="Controlling max-offer constraint"
            value={analysis.maxOffer.bindingConstraint ?? 'N/A'}
          />
        </MetricGrid>
      </Panel>
      <Panel title="Underwriting completeness">
        <table>
          <tbody>
            <tr><td>Property information</td><td className="num">{analysis.completion?.property ?? 0}%</td></tr>
            <tr><td>Rent roll</td><td className="num">{analysis.completion?.rentRoll ?? 0}%</td></tr>
            <tr><td>Expenses</td><td className="num">{analysis.completion?.expenses ?? 0}%</td></tr>
            <tr><td>Legal verification</td><td className="num">{analysis.completion?.legal ?? 0}%</td></tr>
            <tr><td>Due diligence</td><td className="num">{analysis.completion?.dueDiligence ?? 0}%</td></tr>
          </tbody>
        </table>
        <p className="muted">
          Missing legal verification is not ordinary incompleteness. Financial STRONG REVIEW becomes
          INVESTIGATE when legal items are unresolved.
        </p>
      </Panel>

      <div className="grid-2">
        <Panel title="Deal health" intro="Classification uses your underwriting targets, not a hidden lender rulebook.">
          <p className="muted">
            {health.passedCount} of {health.totalCount} tests meet the user-set thresholds.
          </p>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Actual</th>
                <th className="num">Target</th>
                <th className="num">Status</th>
              </tr>
            </thead>
            <tbody>
              {health.tests.map((test) => (
                <tr key={test.metric}>
                  <td>{test.metric}</td>
                  <td className="num">{test.actualLabel}</td>
                  <td className="num">{test.targetLabel}</td>
                  <td className={`num ${test.meets ? 'status-good' : 'status-bad'}`}>
                    {test.meets ? 'Meets' : 'Below'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{health.summary}</p>
          {health.legalSummary ? <p className="muted">{health.legalSummary}</p> : null}
          {health.financialSignal ? (
            <p className="small">
              Financial result: {health.financialSignal}. Legal verification:{' '}
              {health.legalComplete ? 'Complete' : 'Incomplete'}. Overall: {health.signal}.
            </p>
          ) : null}
          {(deal.risks ?? []).filter((r) => r.status === 'open').length > 0 ? (
            <p className="muted">
              Open risks: {(deal.risks ?? []).filter((r) => r.status === 'open').map((r) => r.risk || r.category).join('; ')}
            </p>
          ) : (
            <p className="muted">No risks recorded — an empty register is not a safe property.</p>
          )}
          <p className="muted">
            Still unverified: legal occupancy finding{' '}
            {(deal.property.legalOccupancyFinding ?? 'not_verified').replaceAll('_', ' ')}.
          </p>
        </Panel>
        <Panel title="Assumptions in force">
          <table>
            <tbody>
              <tr>
                <td>Rent scenario</td>
                <td className="num">{deal.assumptions.rentScenario}</td>
              </tr>
              <tr>
                <td>Vacancy mode</td>
                <td className="num">{deal.assumptions.vacancyMode}</td>
              </tr>
              <tr>
                <td>Target cap rate</td>
                <td className="num">{pctPoints(deal.assumptions.targetCapRate)}</td>
              </tr>
              <tr>
                <td>User DSCR target</td>
                <td className="num">{deal.assumptions.targetDscr.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Minimum CoC</td>
                <td className="num">{pctPoints(deal.assumptions.minCashOnCash)}</td>
              </tr>
              <tr>
                <td>Maximum LTV</td>
                <td className="num">{pctPoints(deal.assumptions.maxLtv)}</td>
              </tr>
              <tr>
                <td>Unverified income in upside</td>
                <td className="num">{deal.assumptions.includeUnverifiedInUpside ? 'Explicitly enabled' : 'Off'}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
