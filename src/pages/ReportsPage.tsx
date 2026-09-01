import { FormulaBlock } from '../components/MetricCard';
import { PageHeader, Panel } from '../components/ui';
import { DUE_DILIGENCE_CATEGORY_LABELS } from '../constants/dueDiligence';
import { useDeal } from '../hooks/useDeal';
import { money, pct, ratio, signedMoney } from '../utils/format';

function csvEscape(value: string | number | null): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function ReportsPage() {
  const { deal, analysis, exportJson } = useDeal();

  const exportCsv = () => {
    const lines = [
      ['Metric', 'Value'],
      ['Deal', deal.name],
      ['Address', deal.property.address],
      ['Purchase Price', analysis.purchasePrice],
      ['GRI', analysis.gri],
      ['EGI', analysis.egi],
      ['NOI', analysis.noi],
      ['Cap Rate', analysis.capRate],
      ['Loan', analysis.loanAmount],
      ['LTV', analysis.ltv],
      ['DSCR', analysis.dscr],
      ['Cash Flow', analysis.cashFlowAnnual],
      ['CoC', analysis.cashOnCash],
      ['Debt Yield', analysis.debtYield],
      ['Total Cash', analysis.totalCashInvested],
      ['Value @ Target Cap', analysis.supportedValue],
      ['Conservative Max Offer', analysis.maxOffer.conservative],
      ['Signal', analysis.health.signal],
    ];
    const csv = lines.map((row) => row.map((cell) => csvEscape(cell as never)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deal.name.replace(/[^\w]+/g, '-') || 'deal'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack report">
      <PageHeader eyebrow="Investment analysis report" title={deal.name}>
        <p className="muted no-print">
          Print this page to PDF from the browser for a professional underwriting memo. Exports do
          not include a purchase recommendation.
        </p>
        <div className="btn-row no-print">
          <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
          <button type="button" className="secondary" onClick={exportJson}>Export JSON</button>
          <button type="button" className="secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </PageHeader>

      <Panel title="Executive decision summary">
        <table>
          <tbody>
            <tr><td>Property</td><td>{deal.property.address || deal.name}</td></tr>
            <tr><td>Asking price</td><td className="num">{money(analysis.purchasePrice)}</td></tr>
            <tr><td>Maximum offer</td><td className="num">{money(analysis.maxOffer.conservative)}</td></tr>
            <tr><td>Cash required</td><td className="num">{money(analysis.totalCashInvested)}</td></tr>
            <tr><td>Verified annual rent (GRI)</td><td className="num">{money(analysis.gri)}</td></tr>
            <tr><td>Excluded / unverified income</td><td className="num">{money(analysis.unverifiedIncomeAnnual)}</td></tr>
            <tr><td>NOI</td><td className="num">{money(analysis.noi)}</td></tr>
            <tr><td>DSCR</td><td className="num">{ratio(analysis.dscr)}</td></tr>
            <tr><td>Monthly cash flow</td><td className="num">{money(analysis.cashFlowMonthly)}</td></tr>
            <tr><td>CoC</td><td className="num">{pct(analysis.cashOnCash)}</td></tr>
            <tr><td>Classification</td><td className="num"><strong>{analysis.health.signal}</strong></td></tr>
          </tbody>
        </table>
        <h3>Top reasons</h3>
        <p>{analysis.health.summary}</p>
        <h3>Top risks</h3>
        <p>
          {(deal.risks ?? []).filter((r) => r.status === 'open').map((r) => r.risk || r.category).join('; ') ||
            'No risks recorded — an empty register is not a safe property.'}
        </p>
        <h3>What needs verification</h3>
        <p>{analysis.health.legalSummary}</p>
        <p className="small muted">This page-one summary is a screening memo, not a guaranteed investment.</p>
      </Panel>
      <Panel title="Property summary">
        <p>
          {deal.property.address || 'Address not entered'} · {deal.property.borough} ·{' '}
          {deal.property.neighborhood} · {deal.property.propertyType}
        </p>
        <p className="small muted">
          Block {deal.property.block || '—'} · Lot {deal.property.lot || '—'} · Legal units{' '}
          {deal.property.legalUnitCount} · CO: {deal.property.certificateOfOccupancyStatus}
        </p>
        <p>
          Deal signal: <strong>{analysis.health.signal}</strong>. {analysis.health.summary}
        </p>
        <p className="small">
          Printed {new Date().toLocaleString()} · {deal.property.address || deal.name} · Financial
          result {analysis.health.financialSignal ?? analysis.health.signal}
        </p>
      </Panel>

      <Panel title="Purchase assumptions">
        <table>
          <tbody>
            <tr><td>Purchase price</td><td className="num">{money(analysis.purchasePrice)}</td></tr>
            <tr><td>Down payment</td><td className="num">{money(analysis.downPayment)}</td></tr>
            <tr><td>Loan</td><td className="num">{money(analysis.loanAmount)}</td></tr>
            <tr><td>Rate / amort.</td><td className="num">{deal.loan.interestRate}% / {deal.loan.amortizationYears} yrs</td></tr>
            <tr><td>Rent scenario</td><td className="num">{deal.assumptions.rentScenario}</td></tr>
            <tr><td>Vacancy</td><td className="num">{deal.assumptions.vacancyMode === 'combined' ? `${deal.assumptions.combinedVacancyPercent}% combined` : `${deal.assumptions.physicalVacancyPercent}% + ${deal.assumptions.collectionLossPercent}%`}</td></tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Rent roll (legal / verified units only in GRI)">
        <table>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Bd/Ba</th>
              <th className="num">Current</th>
              <th className="num">Market</th>
              <th className="num">Underwritten</th>
              <th>Legal</th>
            </tr>
          </thead>
          <tbody>
            {deal.units.map((unit) => (
              <tr key={unit.id}>
                <td>{unit.identifier}</td>
                <td>{unit.bedrooms}/{unit.bathrooms}</td>
                <td className="num">{money(unit.currentMonthlyRent)}</td>
                <td className="num">{money(unit.marketMonthlyRent)}</td>
                <td className="num">{money(unit.underwrittenMonthlyRent)}</td>
                <td>{unit.legalOccupancyVerified ? 'Verified' : 'Unverified — excluded'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Income, expenses, NOI">
        <table>
          <tbody>
            <tr><td>GRI</td><td className="num">{money(analysis.gri)}</td></tr>
            <tr><td>Vacancy / collection</td><td className="num">{money(analysis.vacancyAndCollectionLoss)}</td></tr>
            <tr><td>Other legal income</td><td className="num">{money(analysis.otherLegalIncome)}</td></tr>
            <tr><td>EGI</td><td className="num">{money(analysis.egi)}</td></tr>
            <tr><td>Operating expenses</td><td className="num">{money(analysis.operatingExpenses)}</td></tr>
            <tr><td>NOI</td><td className="num">{money(analysis.noi)}</td></tr>
            <tr><td>Unverified income (excluded from base)</td><td className="num">{money(analysis.unverifiedIncomeAnnual)}</td></tr>
          </tbody>
        </table>
        <FormulaBlock trace={analysis.traces.noi} />
      </Panel>

      <Panel title="Financing, debt, cash flow, returns">
        <table>
          <tbody>
            <tr><td>Monthly P&I</td><td className="num">{money(analysis.monthlyPI)}</td></tr>
            <tr><td>Annual debt service</td><td className="num">{money(analysis.annualDebtService)}</td></tr>
            <tr><td>DSCR</td><td className="num">{ratio(analysis.dscr)}</td></tr>
            <tr><td>LTV (purchase price)</td><td className="num">{pct(analysis.ltv)}</td></tr>
            <tr><td>Annual cash flow</td><td className="num">{money(analysis.cashFlowAnnual)}</td></tr>
            <tr><td>Total cash invested</td><td className="num">{money(analysis.totalCashInvested)}</td></tr>
            <tr><td>CoC</td><td className="num">{pct(analysis.cashOnCash)}</td></tr>
            <tr><td>Debt yield</td><td className="num">{pct(analysis.debtYield)}</td></tr>
            <tr><td>Break-even occupancy</td><td className="num">{pct(analysis.breakEvenOccupancy)}</td></tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Valuation and maximum offer">
        <table>
          <tbody>
            <tr><td>Value @ target cap</td><td className="num">{money(analysis.supportedValue)}</td></tr>
            <tr><td>Difference vs asking</td><td className="num">{signedMoney(analysis.askingVsValue)}</td></tr>
            <tr><td>Max offer by cap rate</td><td className="num">{money(analysis.maxOffer.byCapRate)}</td></tr>
            <tr><td>Max offer by DSCR</td><td className="num">{money(analysis.maxOffer.byDscr)}</td></tr>
            <tr><td>Max offer by CoC</td><td className="num">{money(analysis.maxOffer.byCashOnCash)}</td></tr>
            <tr><td>Max offer by financing</td><td className="num">{money(analysis.maxOffer.byFinancing)}</td></tr>
            <tr><td>Conservative maximum offer</td><td className="num">{money(analysis.maxOffer.conservative)}</td></tr>
            <tr><td>Binding constraint</td><td className="num">{analysis.maxOffer.bindingConstraint ?? '—'}</td></tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Scenario analysis">
        <table>
          <thead>
            <tr><th></th><th className="num">Conservative</th><th className="num">Base</th><th className="num">Upside</th></tr>
          </thead>
          <tbody>
            <tr><td>NOI</td><td className="num">{money(analysis.scenarios.conservative.noi)}</td><td className="num">{money(analysis.scenarios.base.noi)}</td><td className="num">{money(analysis.scenarios.upside.noi)}</td></tr>
            <tr><td>Cap Rate</td><td className="num">{pct(analysis.scenarios.conservative.capRate)}</td><td className="num">{pct(analysis.scenarios.base.capRate)}</td><td className="num">{pct(analysis.scenarios.upside.capRate)}</td></tr>
            <tr><td>DSCR</td><td className="num">{ratio(analysis.scenarios.conservative.dscr)}</td><td className="num">{ratio(analysis.scenarios.base.dscr)}</td><td className="num">{ratio(analysis.scenarios.upside.dscr)}</td></tr>
            <tr><td>Cash flow</td><td className="num">{money(analysis.scenarios.conservative.cashFlow)}</td><td className="num">{money(analysis.scenarios.base.cashFlow)}</td><td className="num">{money(analysis.scenarios.upside.cashFlow)}</td></tr>
            <tr><td>Unverified included</td><td className="num">No</td><td className="num">No</td><td className="num">{analysis.scenarios.upside.includesUnverifiedIncome ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Sensitivity (interest rates)">
        <table>
          <thead>
            <tr><th>Case</th><th className="num">Debt service</th><th className="num">DSCR</th><th className="num">Cash flow</th><th className="num">CoC</th></tr>
          </thead>
          <tbody>
            {analysis.interestSensitivity.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="num">{money(row.annualDebtService)}</td>
                <td className="num">{ratio(row.dscr)}</td>
                <td className="num">{money(row.cashFlow)}</td>
                <td className="num">{pct(row.cashOnCash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {deal.renovation.enabled ? (
        <Panel title="Renovation analysis">
          <p>
            NOI increase {money(analysis.renovation.noiIncrease)} · Value created{' '}
            {money(analysis.renovation.valueCreated)} · Cost {money(analysis.renovation.renovationCost)}
          </p>
        </Panel>
      ) : null}

      {deal.refinance.enabled ? (
        <Panel title="Refinance analysis">
          <p>
            Max refi loan {money(analysis.refinance.maxRefinanceLoan)} · Cash from refi{' '}
            {money(analysis.refinance.cashFromRefinance)} · Cash left in deal{' '}
            {money(analysis.refinance.cashLeftInDeal)}
          </p>
        </Panel>
      ) : null}

      <Panel title="Due-diligence checklist">
        {deal.dueDiligence.map((item) => (
          <p key={item.id} className="small">
            [{DUE_DILIGENCE_CATEGORY_LABELS[item.category]}] {item.label} — {item.status.replaceAll('_', ' ')}
            {item.notes ? ` — ${item.notes}` : ''}
          </p>
        ))}
      </Panel>

      {(analysis.offerRows ?? []).length > 0 ? (
        <Panel title="Offer scenarios">
          <table>
            <tbody>
              {analysis.offerRows?.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{pct(row.cashOnCash)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {(analysis.stressTests ?? []).length > 0 ? (
        <Panel title="Stress testing">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th className="num">Cash flow</th>
                <th className="num">DSCR</th>
              </tr>
            </thead>
            <tbody>
              {analysis.stressTests?.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {(deal.comps ?? []).length > 0 ? (
        <Panel title="Comparable sales">
          <p>
            {analysis.compSummary?.count} manual comps. Average {money(analysis.compSummary?.averagePrice)}.
            Range {money(analysis.compSummary?.rangeLow)} – {money(analysis.compSummary?.rangeHigh)}.
            Not an appraisal.
          </p>
        </Panel>
      ) : null}
      <Panel title="Due diligence and risk register">
        <p>
          Critical issues: {(analysis.health.criticalIssues ?? []).join('; ') || 'None recorded.'}
        </p>
        {(deal.risks ?? []).map((risk) => (
          <p key={risk.id} className="small">
            [{risk.category}] {risk.risk || '(untitled)'} — {risk.status} · {risk.probability}/{risk.impact}
          </p>
        ))}
      </Panel>
      <Panel title="Final underwriting classification">
        <p>
          <strong>{analysis.health.signal}</strong> — financial {analysis.health.financialSignal ?? analysis.health.signal}.{' '}
          {analysis.health.legalSummary}
        </p>
        <p>This is not a guaranteed investment and is not a BUY recommendation.</p>
      </Panel>
      <Panel title="Risks, unverified information, and investor notes">
        <p>
          Unverified / potential annual income excluded from the base case:{' '}
          {money(analysis.unverifiedIncomeAnnual)}.
        </p>
        <p>
          Units without verified legal occupancy:{' '}
          {deal.units.filter((u) => !u.legalOccupancyVerified).map((u) => u.identifier).join(', ') || 'None marked.'}
        </p>
        <p>{deal.investorNotes || 'No investor notes entered.'}</p>
        <p className="small muted">
          This report is a screening and education tool. It is not legal, tax, lending, appraisal, or
          investment advice. Official NYC records must be checked independently.
        </p>
      </Panel>
    </div>
  );
}
