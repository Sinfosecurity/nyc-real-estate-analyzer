import { useMemo, useState } from 'react';
import { analyzeDeal } from '../../calculations/analyze';
import { ExplainBlock, LearnLink } from '../../components/guided/chrome';
import { Banner, PageHeader, Panel } from '../../components/ui';
import { useDeal } from '../../hooks/useDeal';
import {
  bottomLine,
  dealHealthChips,
  excludedMonthlyRent,
  investorAnswers,
  plainEnglishSignal,
  priceForTargetMonthlyCashFlow,
  priorityAlerts,
  verifiedMonthlyRent,
  whyNumbersAreLow,
} from '../../ux/narrative';
import { calculateGuidedProgress } from '../../ux/progress';
import { money, pct, ratio, signedMoney } from '../../utils/format';

export function StepAnalysis() {
  const { deal, analysis } = useDeal();
  const progress = calculateGuidedProgress(deal, analysis);
  const copy = plainEnglishSignal(analysis.health.signal);
  const why = whyNumbersAreLow(deal);
  const chips = dealHealthChips(deal, analysis);
  const alerts = priorityAlerts(deal, analysis);
  const [offer, setOffer] = useState(deal.loan.purchasePrice || 0);
  const [showReview, setShowReview] = useState(true);
  const trial = useMemo(
    () =>
      analyzeDeal({
        ...deal,
        loan: { ...deal.loan, purchasePrice: offer, useManualLoanAmount: false },
      }),
    [deal, offer],
  );
  const priceFor500 = priceForTargetMonthlyCashFlow(deal, 500);
  const questions = investorAnswers(deal, analysis);

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 6 of 8" title="Analyze my deal">
        <p className="muted">Same engine as Advanced Mode. These words interpret the numbers; they do not change them.</p>
        <LearnLink to="/learn?topic=cap">Learn: cap rate vs cash-on-cash</LearnLink>
      </PageHeader>

      {showReview ? (
        <Panel title="Before we analyze">
          <ul className="review-list">
            <li>{deal.loan.purchasePrice > 0 ? '✓' : '○'} Purchase price entered</li>
            <li>{verifiedMonthlyRent(deal) > 0 ? '✓' : '○'} Rent entered</li>
            <li>✓ Vacancy assumption entered</li>
            <li>{(deal.expenses.find((e) => e.key === 'taxes')?.annualAmount ?? 0) > 0 ? '✓' : '⚠'} Property taxes entered</li>
            <li>
              {(deal.expenses.find((e) => e.key === 'insurance')?.annualAmount ?? 0) > 0
                ? '⚠ Insurance is a user figure'
                : '○ Insurance not entered'}
            </li>
            <li>{(analysis.sourceConflicts ?? []).length ? '⚠ Unit-count conflict unresolved' : '✓ No stored unit-count conflict'}</li>
            <li>{(deal.comps ?? []).length ? '✓ Comps entered' : '○ Comparable sales not completed'}</li>
          </ul>
          <div className="btn-row">
            <button type="button" className="btn-xl" onClick={() => setShowReview(false)}>
              Analyze conservatively anyway
            </button>
            {!progress.readyToAnalyze ? (
              <span className="muted">You can still view results. Missing: {progress.missingCritical.join(', ')}</span>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <p className="eyebrow">{analysis.health.signal}</p>
        <h2>{copy.headline}</h2>
        <p>{copy.body}</p>
        <p>{analysis.health.summary}</p>
      </Panel>

      {alerts.map((alert) => (
        <Banner key={alert.title} tone={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warn' : 'info'}>
          <strong>{alert.severity.toUpperCase()} — {alert.title}</strong>
          <p>{alert.body}</p>
        </Banner>
      ))}

      {why ? (
        <Banner tone="danger">
          <h3>Why are my numbers so low?</h3>
          <p>{why}</p>
        </Banner>
      ) : null}

      <Panel title="Top result summary">
        <div className="metric-grid">
          <Stat label="Asking price" value={money(analysis.purchasePrice)} />
          <Stat label="Verified monthly rent" value={money(verifiedMonthlyRent(deal))} />
          <Stat label="Potential rent excluded" value={money(excludedMonthlyRent(deal))} warn />
          <Stat label="NOI" value={money(analysis.noi)} />
          <Stat label="Monthly mortgage" value={money(analysis.monthlyPI)} />
          <Stat label="Monthly cash flow" value={money(analysis.cashFlowMonthly)} />
          <Stat label="Cash required" value={money(analysis.totalCashInvested)} />
          <Stat label="Maximum offer" value={money(analysis.maxOffer.conservative)} emphasis />
        </div>
      </Panel>

      <Panel title="The bottom line">
        {bottomLine(deal, analysis).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Panel>

      <Panel title="Deal health">
        <ul className="health-list">
          {chips.map((chip) => (
            <li key={chip.label} className={`health-${chip.state}`}>
              <strong>{chip.label}</strong>
              <span>
                {chip.state === 'ok' ? '✓' : chip.state === 'bad' ? '✕' : chip.state === 'warn' ? '⚠' : '○'} {chip.detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="eyebrow">Overall</p>
        <h2>{analysis.health.signal}</h2>
      </Panel>

      <Panel title="What should I offer?">
        <LearnLink to="/learn?topic=offer">Learn: how investors determine maximum offer</LearnLink>
        <table>
          <tbody>
            <tr><td>Asking price</td><td className="num">{money(analysis.purchasePrice)}</td></tr>
            <tr><td>Maximum by cap rate</td><td className="num">{money(analysis.maxOffer.byCapRate)}</td></tr>
            <tr><td>Maximum by DSCR</td><td className="num">{money(analysis.maxOffer.byDscr)}</td></tr>
            <tr><td>Maximum by cash-on-cash</td><td className="num">{money(analysis.maxOffer.byCashOnCash)}</td></tr>
            <tr><td>Maximum by available cash</td><td className="num">{money(analysis.maxOffer.byAvailableCash ?? null)}</td></tr>
            <tr>
              <td>Recommended conservative maximum</td>
              <td className="num"><strong>{money(analysis.maxOffer.conservative)}</strong></td>
            </tr>
            <tr>
              <td>Difference from asking</td>
              <td className="num">
                {signedMoney(
                  analysis.maxOffer.conservative != null ? analysis.maxOffer.conservative - analysis.purchasePrice : null,
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Your <strong>{analysis.maxOffer.bindingConstraint ?? 'active constraint'}</strong> is currently the
          controlling constraint. This is a model output, not a certified bid.
        </p>
      </Panel>

      <Panel title="Test an offer">
        <label className="field">
          <span className="field-label">Offer price ${offer.toLocaleString('en-US')}</span>
          <input
            type="range"
            min={0}
            max={Math.max(deal.loan.purchasePrice * 1.2, 100000)}
            step={5000}
            value={offer}
            onChange={(event) => setOffer(Number(event.target.value))}
          />
          <input type="number" value={offer} onChange={(event) => setOffer(Number(event.target.value) || 0)} />
        </label>
        <div className="metric-grid">
          <Stat label="Cash required" value={money(trial.totalCashInvested)} />
          <Stat label="Mortgage / mo" value={money(trial.monthlyPI)} />
          <Stat label="Cap rate" value={pct(trial.capRate)} />
          <Stat label="DSCR" value={ratio(trial.dscr)} />
          <Stat label="Cash flow / mo" value={money(trial.cashFlowMonthly)} />
          <Stat label="CoC" value={pct(trial.cashOnCash)} />
          <Stat label="Deal health" value={trial.health.signal} />
        </div>
        <p className="small muted">Moving the slider uses the same analyzeDeal() engine. It does not save until you change the purchase price on Financing.</p>
      </Panel>

      <Panel title="What would make this deal work?">
        <p className="muted">Model outputs from current assumptions — not a promise the market will cooperate.</p>
        <table>
          <tbody>
            <tr>
              <td>To reach your cap-rate target, maximum supported price</td>
              <td className="num">{money(analysis.maxOffer.byCapRate)}</td>
            </tr>
            <tr>
              <td>To reach DSCR {deal.assumptions.targetDscr.toFixed(2)}, loan-supported purchase price</td>
              <td className="num">{money(analysis.maxOffer.byDscr)}</td>
            </tr>
            <tr>
              <td>To achieve about $500/month positive cash flow, purchase price approximately</td>
              <td className="num">{money(priceFor500)}</td>
            </tr>
            <tr>
              <td>Interest rate where cash flow reaches $0</td>
              <td className="num">
                {analysis.breakpoints?.[0]?.value != null ? `${analysis.breakpoints[0].value.toFixed(2)}%` : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Explain the metrics">
        <ExplainBlock title="GRI" meaning="Scheduled legal rent × 12." formula="Sum of verified monthly rents × 12">
          <p>{money(analysis.gri)}</p>
        </ExplainBlock>
        <ExplainBlock title="EGI" meaning="Rent after vacancy, plus other legal income." formula="GRI − vacancy + other legal income">
          <p>{money(analysis.egi)}</p>
        </ExplainBlock>
        <ExplainBlock title="NOI" meaning="Income after operating expenses, before the mortgage." formula="EGI − OpEx">
          <p>
            {money(analysis.egi)} − {money(analysis.operatingExpenses)} = {money(analysis.noi)}
          </p>
        </ExplainBlock>
        <ExplainBlock title="Cap rate" meaning="Unleveraged yield: NOI ÷ price." formula="NOI ÷ purchase price">
          <p>{pct(analysis.capRate)} vs your {deal.assumptions.targetCapRate}% target.</p>
        </ExplainBlock>
        <ExplainBlock title="DSCR" meaning="NOI dollars per $1 of annual debt service." formula="NOI ÷ annual debt service">
          <p>
            How we calculated DSCR: {money(analysis.noi)} ÷ {money(analysis.annualDebtService)} = {ratio(analysis.dscr)}.
            {analysis.dscr != null && analysis.dscr >= deal.assumptions.targetDscr
              ? ` ✓ Meets your ${deal.assumptions.targetDscr.toFixed(2)} target.`
              : ` Below your ${deal.assumptions.targetDscr.toFixed(2)} target.`}
          </p>
        </ExplainBlock>
        <ExplainBlock title="Cash-on-cash" meaning="Annual cash flow ÷ cash you actually invest." formula="Cash flow ÷ total cash invested">
          <p>{pct(analysis.cashOnCash)}</p>
        </ExplainBlock>
      </Panel>

      <Panel title="Questions about this deal">
        {questions.map((item) => (
          <details key={item.q} className="explain-block">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </Panel>
    </div>
  );
}

function Stat({ label, value, warn, emphasis }: { label: string; value: string; warn?: boolean; emphasis?: boolean }) {
  return (
    <article className={`metric-card ${warn ? 'tone-warn' : ''} ${emphasis ? 'tone-emphasis' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}
