import { isBaseCaseUnit, resolveIncomeStatus } from '../calculations/income';
import { DUE_DILIGENCE_CATEGORY_LABELS } from '../constants/dueDiligence';
import type { Deal, DealAnalysis, DueDiligenceCategory } from '../models';
import { money, pct } from '../utils/format';
import { reportBreakpoints } from './breakpoints';
import {
  expectedUnitsFromPropertyType,
  formatDate,
  formatDscr,
  formatSigned,
  moneyOrNotProvided,
  REPORT_DISCLAIMER,
  suspiciousMonthlyRent,
} from './display';
import { executiveNarrative, pricePosition, supportAndBreakItems } from './narrative';
import { nycRecordsSummary } from './nycRecords';
import { populatedOfferScenarios } from './offers';
import type { ReportKind, ReportReadiness } from './types';

function H({ children }: { children: string }) {
  return <h2 className="rpt-h">{children}</h2>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rpt-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Provenance({ kind }: { kind: string }) {
  return <span className={`rpt-src src-${kind}`}>{kind.replaceAll('_', ' ')}</span>;
}

export function ReportDocument({
  deal,
  analysis,
  readiness,
  kind,
}: {
  deal: Deal;
  analysis: DealAnalysis;
  readiness: ReportReadiness;
  kind: ReportKind;
}) {
  const asking = analysis.purchasePrice;
  const position = pricePosition(deal, analysis);
  const narrative = executiveNarrative(deal, analysis, readiness);
  const points = supportAndBreakItems(deal, analysis, readiness);
  const offers = populatedOfferScenarios(deal, analysis);
  const breakpoints = reportBreakpoints(deal, analysis);
  const records = nycRecordsSummary(deal);
  const verifiedUnits = deal.units.filter((unit) => isBaseCaseUnit(unit));
  const excludedAnnual = analysis.unverifiedIncomeAnnual;
  const potentialAnnual = deal.units.reduce((sum, unit) => sum + unit.marketMonthlyRent * 12, 0);
  const verifiedAnnual = verifiedUnits.reduce((sum, unit) => sum + unit.underwrittenMonthlyRent * 12, 0);
  const showFull = kind === 'full';
  const showExec = kind === 'executive' || kind === 'full';
  const showDd = kind === 'diligence' || kind === 'full';
  const categories = Array.from(new Set(deal.dueDiligence.map((item) => item.category)));
  const criticalOpen = deal.dueDiligence.filter((item) =>
    /certificate of occupancy|legal unit|tax|insurance|inspection/i.test(item.label) &&
    !['verified', 'resolved', 'not_applicable'].includes(item.status),
  );
  const expenseProvided = (key: string) =>
    deal.expenses.some((item) => item.key === key && (item.annualAmount > 0 || item.percentOfEgi > 0));

  return (
    <article className="report-document" data-report-kind={kind}>
      {showExec ? (
        <section className="rpt-page rpt-cover">
          <header className="rpt-masthead">
            <p className="rpt-kicker">NYC Real Estate</p>
            <h1>Investment Underwriting Report</h1>
            <p className="rpt-address">{deal.property.address || 'Address not entered'}</p>
            <p className="rpt-meta">
              {[deal.property.borough, deal.property.neighborhood].filter(Boolean).join(' · ') || 'Borough not entered'}
              {' · '}
              {formatDate()}
            </p>
            <p className="rpt-status-line">
              Analysis status: <strong>{readiness.reportClass}</strong>
            </p>
          </header>

          <div className="rpt-snapshot">
            <H>Property snapshot</H>
            <table className="rpt-kv">
              <tbody>
                <tr><th>Asking price</th><td className="num">{asking > 0 ? money(asking) : 'NOT PROVIDED'}</td></tr>
                <tr><th>Property type</th><td>{deal.property.propertyType || 'NOT PROVIDED'}</td></tr>
                <tr><th>Verified units</th><td>{verifiedUnits.length}</td></tr>
                <tr><th>Underwritten units</th><td>{deal.property.legalUnitCount || 'NOT PROVIDED'}</td></tr>
                <tr><th>Official-record units</th><td>{deal.property.officialUnitCount ?? 'NOT PROVIDED'}</td></tr>
                <tr><th>Building size</th><td>{deal.property.squareFootage ? `${deal.property.squareFootage.toLocaleString('en-US')} sqft` : 'NOT PROVIDED'}</td></tr>
                <tr><th>Year built</th><td>{deal.property.yearBuilt ?? 'NOT PROVIDED'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="rpt-kpi-row">
            <Metric label="Asking price" value={asking > 0 ? money(asking) : 'N/A'} />
            <Metric label="Maximum offer" value={analysis.maxOffer.conservative !== null ? money(analysis.maxOffer.conservative) : 'N/A'} />
            <Metric label="Total cash required" value={money(analysis.totalCashInvested)} />
            <Metric label="NOI" value={money(analysis.noi)} />
            <Metric label="Monthly cash flow" value={money(analysis.cashFlowMonthly)} />
            <Metric label="DSCR" value={formatDscr(analysis.dscr)} />
            <Metric label="Cash-on-cash" value={pct(analysis.cashOnCash)} />
            <Metric label="Cap rate" value={pct(analysis.capRate)} />
          </div>

          {!readiness.expense.complete ? (
            <div className="rpt-banner danger">
              <strong>Operating expense assumptions incomplete.</strong> {readiness.expense.warning}
            </div>
          ) : null}
          {readiness.conflicts
            .filter((item) => item.severity === 'critical' && item.id !== 'incomplete-opex')
            .slice(0, 3)
            .map((item) => (
              <div key={item.id} className="rpt-banner warn">
                <strong>{item.title}.</strong> {item.explanation}
              </div>
            ))}

          <div className="rpt-class-block">
            <div>
              <span>Financial result</span>
              <strong>{readiness.financialSignal}</strong>
            </div>
            <div>
              <span>Underwriting confidence</span>
              <strong>{readiness.confidence}</strong>
            </div>
            <div>
              <span>Overall status</span>
              <strong>{readiness.overallStatus}</strong>
            </div>
          </div>

          <H>Executive investment conclusion</H>
          <p className="rpt-narrative">{narrative}</p>

          <div className="rpt-split">
            <div>
              <H>What supports the deal</H>
              <ul className="rpt-flags">
                {points.filter((item) => item.tone === 'support').map((item) => (
                  <li key={item.text}>✓ {item.text}</li>
                ))}
              </ul>
            </div>
            <div>
              <H>What could break the deal</H>
              <ul className="rpt-flags">
                {points.filter((item) => item.tone === 'break').map((item) => (
                  <li key={item.text}>⚠ {item.text}</li>
                ))}
              </ul>
            </div>
          </div>

          <H>Price position</H>
          <div className="rpt-price-bars">
            {[
              ['Asking price', position.asking],
              ['Conservative max offer', position.conservativeMax],
              ['Income value', position.incomeValue],
            ].map(([label, value]) => {
              const numeric = typeof value === 'number' ? value : 0;
              const max = Math.max(position.asking, position.conservativeMax ?? 0, position.incomeValue ?? 0, 1);
              return (
                <div key={String(label)} className="rpt-bar-row">
                  <span>{label}</span>
                  <i style={{ width: `${Math.min(100, (numeric / max) * 100)}%` }} />
                  <em>{numeric > 0 ? money(numeric) : 'N/A'}</em>
                </div>
              );
            })}
          </div>
          <p>
            Asking vs max offer:{' '}
            <strong>
              {position.difference === null
                ? 'N/A'
                : `${formatSigned(position.difference)} ${position.insideRange ? 'cushion' : 'pricing gap'}`}
            </strong>
            . {position.explanation}
          </p>
        </section>
      ) : null}

      {showFull || kind === 'diligence' ? (
        <section className="rpt-page">
          <H>Property & verification profile</H>
          <table className="rpt-grid">
            <tbody>
              <tr><th>Address</th><td>{deal.property.address || 'NOT PROVIDED'}</td><td><Provenance kind={deal.property.lastLookupAt ? 'official_source' : 'user_entered'} /></td></tr>
              <tr><th>Borough / neighborhood</th><td>{[deal.property.borough, deal.property.neighborhood].filter(Boolean).join(' · ') || 'NOT PROVIDED'}</td><td><Provenance kind={deal.property.lastLookupAt ? 'official_source' : 'user_entered'} /></td></tr>
              <tr><th>BBL / block / lot</th><td>{[deal.property.bbl || '—', deal.property.block || '—', deal.property.lot || '—'].join(' · ')}</td><td><Provenance kind={deal.property.bbl ? 'official_source' : 'unverified'} /></td></tr>
              <tr><th>Property type</th><td>{deal.property.propertyType}</td><td><Provenance kind={deal.property.lastLookupAt ? 'official_source' : 'user_entered'} /></td></tr>
              <tr><th>Year built / building / lot</th><td>{[deal.property.yearBuilt ?? '—', deal.property.squareFootage ? `${deal.property.squareFootage.toLocaleString('en-US')} sf` : '—', deal.property.lotSize ? `${deal.property.lotSize.toLocaleString('en-US')} sf` : '—'].join(' / ')}</td><td><Provenance kind={deal.property.lastLookupAt ? 'official_source' : 'user_entered'} /></td></tr>
              <tr><th>Zoning</th><td>{deal.property.zoning || 'NOT PROVIDED'}</td><td><Provenance kind={deal.property.officialZoning ? 'official_source' : 'user_entered'} /></td></tr>
              <tr><th>Listing units</th><td>{deal.property.observedUnitCount ?? 'NOT PROVIDED'}</td><td><Provenance kind="listing_source" /></td></tr>
              <tr><th>Official-record units</th><td>{deal.property.officialUnitCount ?? 'NOT PROVIDED'}</td><td><Provenance kind="official_source" /></td></tr>
              <tr><th>Underwritten units</th><td>{deal.property.legalUnitCount || 'NOT PROVIDED'}</td><td><Provenance kind="user_entered" /></td></tr>
              <tr><th>Certificate of Occupancy</th><td>{deal.property.certificateOfOccupancyStatus}</td><td><Provenance kind="unverified" /></td></tr>
              <tr><th>Property-tax source</th><td>{deal.property.tax?.sourceUsed ?? 'underwritten'}</td><td><Provenance kind="user_entered" /></td></tr>
              <tr><th>Listing source</th><td>{deal.property.listingSource || deal.property.listingUrl || 'NOT PROVIDED'}</td><td><Provenance kind="listing_source" /></td></tr>
            </tbody>
          </table>
          {expectedUnitsFromPropertyType(deal.property.propertyType) !== null &&
          deal.property.legalUnitCount === 0 ? (
            <p className="rpt-banner warn">
              <strong>DATA CONFLICT.</strong> Property type {deal.property.propertyType} cannot be read as a verified
              legal unit count while legal units remain 0.
            </p>
          ) : null}

          <H>Source conflicts</H>
          {readiness.conflicts.filter((item) => item.title === 'DATA CONFLICT').length === 0 ? (
            <p>No unresolved source conflicts were detected in the current inputs.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Status</th><th>Explanation</th></tr>
              </thead>
              <tbody>
                {readiness.conflicts
                  .filter((item) => item.title === 'DATA CONFLICT')
                  .map((item) => (
                    <tr key={item.id}>
                      <td>REQUIRES REVIEW</td>
                      <td>{item.explanation}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          <p className="small">
            Listing units {deal.property.observedUnitCount ?? 'n/a'} · Official {deal.property.officialUnitCount ?? 'n/a'} ·
            Underwritten {deal.property.legalUnitCount || 0} · Verified rent-roll units {verifiedUnits.length}. Conflicts
            affect whether income may be relied upon in the base case.
          </p>
        </section>
      ) : null}

      {showFull ? (
        <section className="rpt-page">
          <H>Rent roll</H>
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Bed/Bath</th>
                <th>Status</th>
                <th className="num">Current rent</th>
                <th className="num">Market rent</th>
                <th className="num">Underwritten rent</th>
                <th className="num">Annual rent</th>
                <th>Legal / verification</th>
                <th>Regulation</th>
              </tr>
            </thead>
            <tbody>
              {deal.units.map((unit) => {
                const annual = unit.underwrittenMonthlyRent * 12;
                return (
                  <tr key={unit.id}>
                    <td>{unit.identifier}</td>
                    <td>{unit.bedrooms}/{unit.bathrooms}</td>
                    <td>{unit.occupancyStatus}</td>
                    <td className="num nowrap">{money(unit.currentMonthlyRent)}</td>
                    <td className="num nowrap">{money(unit.marketMonthlyRent)}</td>
                    <td className="num nowrap">{money(unit.underwrittenMonthlyRent)}</td>
                    <td className="num nowrap">{money(annual)}</td>
                    <td>{resolveIncomeStatus(unit).replaceAll('_', ' ')}</td>
                    <td>{unit.rentRegulationStatus ?? (unit.rentStabilized ? 'stabilized' : 'unknown')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deal.units.some((unit) => suspiciousMonthlyRent(unit.underwrittenMonthlyRent || unit.currentMonthlyRent)) ? (
            <p className="rpt-banner warn">
              <strong>VERIFICATION REQUIRED.</strong> At least one monthly rent is below $100. Confirm the figure is not
              a truncated thousands amount.
            </p>
          ) : null}
          <table className="rpt-kv">
            <tbody>
              <tr><th>Verified annual rent</th><td className="num nowrap">{money(verifiedAnnual)}</td></tr>
              <tr><th>Potential annual rent</th><td className="num nowrap">{money(potentialAnnual)}</td></tr>
              <tr><th>Excluded annual rent</th><td className="num nowrap">{money(excludedAnnual)}</td></tr>
              <tr><th>Underwritten GRI</th><td className="num nowrap">{money(analysis.gri)}</td></tr>
            </tbody>
          </table>
          <p className="small">
            Exclusions: unverified or potentially non-conforming space stays out of base-case GRI until legal occupancy
            is verified. Current excluded / unverified income is {money(excludedAnnual)} per year.
          </p>

          <H>Income statement</H>
          <table>
            <tbody>
              <tr><th>Gross potential rent</th><td className="num nowrap">{money(analysis.gpr)}</td></tr>
              <tr><th>Less vacancy / collection</th><td className="num nowrap">{money(analysis.vacancyAndCollectionLoss)}</td></tr>
              <tr><th>Other legal income</th><td className="num nowrap">{money(analysis.otherLegalIncome)}</td></tr>
              <tr><th>Effective gross income</th><td className="num nowrap"><strong>{money(analysis.egi)}</strong></td></tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {showFull ? (
        <section className="rpt-page">
          <H>Operating expenses & NOI</H>
          {!readiness.expense.complete ? (
            <div className="rpt-banner danger">
              <strong>Operating expense assumptions incomplete.</strong> {readiness.expense.warning}
            </div>
          ) : null}
          <table>
            <thead>
              <tr><th>Category</th><th className="num">Annual amount</th></tr>
            </thead>
            <tbody>
              {analysis.expenseDetails.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="num nowrap">{moneyOrNotProvided(row.annualAmount, expenseProvided(row.key))}</td>
                </tr>
              ))}
              <tr>
                <th>Total operating expenses</th>
                <th className="num nowrap">{money(analysis.operatingExpenses)}</th>
              </tr>
              <tr>
                <th>Net operating income</th>
                <th className="num nowrap">{money(analysis.noi)}</th>
              </tr>
            </tbody>
          </table>
          <p>
            Expense ratio {pct(analysis.operatingExpenseRatio)} · NOI margin{' '}
            {analysis.egi > 0 ? pct(analysis.noi / analysis.egi) : 'N/A'}
          </p>
        </section>
      ) : null}

      {showFull ? (
        <section className="rpt-page">
          <H>Financing summary</H>
          <table className="rpt-kv">
            <tbody>
              <tr><th>Purchase price</th><td className="num nowrap">{asking > 0 ? money(asking) : 'NOT PROVIDED'}</td></tr>
              <tr><th>Down payment</th><td className="num nowrap">{money(analysis.downPayment)}</td></tr>
              <tr><th>Down payment %</th><td className="num">{deal.loan.downPaymentPercent.toFixed(2)}%</td></tr>
              <tr><th>Loan amount</th><td className="num nowrap">{money(analysis.loanAmount)}</td></tr>
              <tr><th>LTV</th><td className="num">{pct(analysis.ltv)}</td></tr>
              <tr><th>Interest rate</th><td className="num">{deal.loan.interestRate.toFixed(2)}%</td></tr>
              <tr><th>Amortization</th><td className="num">{deal.loan.amortizationYears} years</td></tr>
              <tr><th>Monthly P&amp;I</th><td className="num nowrap">{money(analysis.monthlyPI)}</td></tr>
              <tr><th>Annual debt service</th><td className="num nowrap">{money(analysis.annualDebtService)}</td></tr>
              <tr><th>Closing costs</th><td className="num nowrap">{money(analysis.buyerClosingCosts)}</td></tr>
              <tr><th>Loan fees / points</th><td className="num nowrap">{money(analysis.financingFees)}</td></tr>
              <tr><th>Renovation budget</th><td className="num nowrap">{money(deal.acquisition.renovationBudget)}</td></tr>
              <tr><th>Reserves</th><td className="num nowrap">{money(deal.acquisition.initialReserves)}</td></tr>
              <tr><th>Total cash required</th><td className="num nowrap"><strong>{money(analysis.totalCashInvested)}</strong></td></tr>
              <tr><th>DSCR</th><td className="num">{formatDscr(analysis.dscr)}</td></tr>
              <tr><th>Debt yield</th><td className="num">{pct(analysis.debtYield)}</td></tr>
              <tr><th>Break-even occupancy</th><td className="num">{pct(analysis.breakEvenOccupancy)}</td></tr>
            </tbody>
          </table>

          <H>Returns summary</H>
          <table className="rpt-kv">
            <tbody>
              <tr><th>Monthly cash flow</th><td className="num nowrap">{money(analysis.cashFlowMonthly)}</td></tr>
              <tr><th>Annual cash flow</th><td className="num nowrap">{money(analysis.cashFlowAnnual)}</td></tr>
              <tr><th>Cash-on-cash (cash investor return)</th><td className="num">{pct(analysis.cashOnCash)}</td></tr>
              <tr><th>Cap rate (property return)</th><td className="num">{pct(analysis.capRate)}</td></tr>
              <tr><th>Debt yield</th><td className="num">{pct(analysis.debtYield)}</td></tr>
              <tr><th>DSCR (financing effect)</th><td className="num">{formatDscr(analysis.dscr)}</td></tr>
              <tr><th>Year-1 principal paydown</th><td className="num nowrap">{money(analysis.equity.principalPaydownYear1)}</td></tr>
            </tbody>
          </table>
          <p className="small">
            Cap rate is the unlevered property return. DSCR describes financing coverage. Cash-on-cash is the cash
            investor return after debt service.
          </p>
        </section>
      ) : null}

      {showFull ? (
        <section className="rpt-page">
          <H>Valuation analysis</H>
          <table className="rpt-kv">
            <tbody>
              <tr><th>NOI</th><td className="num nowrap">{money(analysis.noi)}</td></tr>
              <tr><th>Target cap</th><td className="num">{deal.assumptions.targetCapRate.toFixed(2)}%</td></tr>
              <tr><th>Income-approach value</th><td className="num nowrap">{analysis.supportedValue !== null ? money(analysis.supportedValue) : 'N/A'}</td></tr>
            </tbody>
          </table>
          {(deal.comps?.length ?? 0) === 0 ? (
            <p className="rpt-banner warn">
              <strong>Comparable sales analysis not completed.</strong> No sales-comparison range is shown.
            </p>
          ) : (
            <table className="rpt-kv">
              <tbody>
                <tr><th>Comparable sales low</th><td className="num nowrap">{money(analysis.compSummary?.rangeLow)}</td></tr>
                <tr><th>Comparable sales median</th><td className="num nowrap">{money(analysis.compSummary?.medianPrice)}</td></tr>
                <tr><th>Comparable sales high</th><td className="num nowrap">{money(analysis.compSummary?.rangeHigh)}</td></tr>
              </tbody>
            </table>
          )}
          {analysis.valuationRange?.indicativeLow != null && (deal.comps?.length ?? 0) > 0 ? (
            <p>
              Underwriting value range {money(analysis.valuationRange.indicativeLow)} –{' '}
              {money(analysis.valuationRange.indicativeHigh)}.
            </p>
          ) : (
            <p>Underwriting value range is limited to the income approach until comparable sales are completed.</p>
          )}

          <H>Maximum offer</H>
          <table className="rpt-kv">
            <tbody>
              <tr><th>Asking price</th><td className="num nowrap">{asking > 0 ? money(asking) : 'NOT PROVIDED'}</td></tr>
              <tr><th>Max by cap rate</th><td className="num nowrap">{money(analysis.maxOffer.byCapRate)}</td></tr>
              <tr><th>Max by DSCR</th><td className="num nowrap">{money(analysis.maxOffer.byDscr)}</td></tr>
              <tr><th>Max by CoC</th><td className="num nowrap">{money(analysis.maxOffer.byCashOnCash)}</td></tr>
              <tr><th>Max by available cash</th><td className="num nowrap">{money(analysis.maxOffer.byAvailableCash)}</td></tr>
              <tr><th>Max by financing</th><td className="num nowrap">{money(analysis.maxOffer.byFinancing)}</td></tr>
              <tr><th>Max by renovation / basis</th><td className="num nowrap">{money(analysis.maxOffer.byRenovationBasis)}</td></tr>
              <tr><th>Conservative maximum offer</th><td className="num nowrap"><strong>{money(analysis.maxOffer.conservative)}</strong></td></tr>
              <tr><th>Binding constraint</th><td>{analysis.maxOffer.bindingConstraint ?? 'N/A'}</td></tr>
            </tbody>
          </table>
          <p>
            {analysis.maxOffer.bindingConstraint
              ? `The ${analysis.maxOffer.bindingConstraint.toLowerCase()} is the controlling acquisition constraint.`
              : 'No binding constraint could be established from the current inputs.'}
          </p>
          {asking > 0 && analysis.maxOffer.conservative !== null ? (
            <p>
              Max offer vs asking: {formatSigned(analysis.maxOffer.conservative - asking)} (
              {pct((analysis.maxOffer.conservative - asking) / asking)}).
            </p>
          ) : null}

          <H>Offer scenarios</H>
          {offers.length === 0 ? (
            <p>No populated offer prices are available. Zero-price scenarios are not printed.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th className="num">Price</th>
                  <th className="num">Down</th>
                  <th className="num">Loan</th>
                  <th className="num">Cash required</th>
                  <th className="num">NOI</th>
                  <th className="num">Cap</th>
                  <th className="num">DSCR</th>
                  <th className="num">Monthly CF</th>
                  <th className="num">CoC</th>
                  <th className="num">vs asking</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td className="num nowrap">{money(row.price)}</td>
                    <td className="num nowrap">{money(row.downPayment)}</td>
                    <td className="num nowrap">{money(row.loan)}</td>
                    <td className="num nowrap">{money(row.cashRequired)}</td>
                    <td className="num nowrap">{money(row.noi)}</td>
                    <td className="num">{pct(row.capRate)}</td>
                    <td className="num">{formatDscr(row.dscr)}</td>
                    <td className="num nowrap">{money(row.cashFlowMonthly)}</td>
                    <td className="num">{pct(row.cashOnCash)}</td>
                    <td className="num nowrap">{formatSigned(row.vsAsking)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {showFull ? (
        <section className="rpt-page">
          <H>Scenario analysis</H>
          <table>
            <thead>
              <tr>
                <th></th>
                <th className="num">Conservative</th>
                <th className="num">Base</th>
                <th className="num">Upside</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['GRI', (s: 'conservative' | 'base' | 'upside') => money(analysis.scenarios[s].gri)],
                  ['EGI', (s: 'conservative' | 'base' | 'upside') => money(analysis.scenarios[s].egi)],
                  ['OpEx / NOI', (s: 'conservative' | 'base' | 'upside') => money(analysis.scenarios[s].noi)],
                  ['Cap rate', (s: 'conservative' | 'base' | 'upside') => pct(analysis.scenarios[s].capRate)],
                  ['DSCR', (s: 'conservative' | 'base' | 'upside') => formatDscr(analysis.scenarios[s].dscr)],
                  ['Monthly cash flow', (s: 'conservative' | 'base' | 'upside') => money(analysis.scenarios[s].cashFlow / 12)],
                  ['Annual cash flow', (s: 'conservative' | 'base' | 'upside') => money(analysis.scenarios[s].cashFlow)],
                  ['CoC', (s: 'conservative' | 'base' | 'upside') => pct(analysis.scenarios[s].cashOnCash)],
                ] as const
              ).map(([label, cell]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td className="num nowrap">{cell('conservative')}</td>
                  <td className="num nowrap">{cell('base')}</td>
                  <td className="num nowrap">{cell('upside')}</td>
                </tr>
              ))}
              <tr>
                <th>Unverified income included</th>
                <td className="num">No</td>
                <td className="num">No</td>
                <td className="num">{analysis.scenarios.upside.includesUnverifiedIncome ? 'Yes' : 'No'}</td>
              </tr>
            </tbody>
          </table>
          <p className="small">Unverified income is never included automatically in the base or conservative cases.</p>

          <H>Stress tests</H>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Case</th>
                <th className="num">DSCR</th>
                <th className="num">Monthly cash flow</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(analysis.stressTests ?? []).map((row) => {
                const dscrOk = row.dscr !== null && row.dscr >= deal.assumptions.targetDscr;
                const cfOk = row.cashFlow > 0;
                const status = dscrOk && cfOk ? 'PASS' : cfOk || (row.dscr ?? 0) >= deal.assumptions.targetDscr - 0.1 ? 'WATCH' : 'FAIL';
                const group = row.label.startsWith('Rent')
                  ? 'Rent'
                  : row.label.startsWith('Vacancy')
                    ? 'Vacancy'
                    : row.label.startsWith('Expenses')
                      ? 'Expense'
                      : row.label.startsWith('Rate')
                        ? 'Interest rate'
                        : 'Base';
                return (
                  <tr key={row.label}>
                    <td>{group}</td>
                    <td>{row.label}</td>
                    <td className="num">{formatDscr(row.dscr)}</td>
                    <td className="num nowrap">{money(row.cashFlow / 12)}</td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <H>Breakpoint analysis</H>
          <div className="rpt-split">
            <div>
              <h3>What would break the deal?</h3>
              <ul>
                {breakpoints.filter((item) => item.kind === 'break').map((item) => (
                  <li key={item.label}>
                    {item.label}:{' '}
                    <strong>
                      {item.value === null
                        ? 'N/A'
                        : item.unit === '$' || item.unit === '$/mo'
                          ? money(item.value)
                          : `${item.value.toFixed(2)} ${item.unit}`}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>What would improve the deal?</h3>
              <ul>
                {breakpoints.filter((item) => item.kind === 'improve').map((item) => (
                  <li key={item.label}>
                    {item.label}:{' '}
                    <strong>
                      {item.value === null
                        ? 'N/A'
                        : item.unit.startsWith('$')
                          ? money(item.value)
                          : `${item.value.toFixed(0)} ${item.unit}`}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {showDd ? (
        <section className="rpt-page">
          <H>NYC public records & legal review</H>
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Status</th>
                <th>Source</th>
                <th>Date</th>
                <th>Key result</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.topic}>
                  <td>{row.topic}</td>
                  <td>{row.status}</td>
                  <td>{row.source}</td>
                  <td>{row.dateChecked || '—'}</td>
                  <td>{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <H>Due diligence dashboard</H>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Complete</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const items = deal.dueDiligence.filter((item) => item.category === category);
                const done = items.filter((item) =>
                  ['verified', 'resolved', 'not_applicable'].includes(item.status),
                ).length;
                return (
                  <tr key={category}>
                    <td>{DUE_DILIGENCE_CATEGORY_LABELS[category as DueDiligenceCategory] ?? category}</td>
                    <td className="num">
                      {done}/{items.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h3>Critical / high-priority open items</h3>
          {criticalOpen.length === 0 ? (
            <p>No high-priority checklist items remain in an unfinished state.</p>
          ) : (
            <ul>
              {criticalOpen.slice(0, 8).map((item) => (
                <li key={item.id}>⚠ {item.label} — {item.status.replaceAll('_', ' ')}</li>
              ))}
            </ul>
          )}
          {kind === 'diligence' ? (
            <>
              <h3>Full due diligence appendix</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {deal.dueDiligence
                    .filter((item) => item.status !== 'not_started')
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.label}</td>
                        <td>{item.status.replaceAll('_', ' ')}</td>
                        <td>{item.notes || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          ) : null}

          <H>Risk register</H>
          {(deal.risks ?? []).length === 0 ? (
            <p>
              No risks have been recorded. This does not mean the property is risk-free. Risk identification remains
              incomplete until due diligence is performed.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Category</th>
                  <th>Probability</th>
                  <th>Impact</th>
                  <th>Status</th>
                  <th>Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {(deal.risks ?? []).map((risk) => (
                  <tr key={risk.id}>
                    <td>{risk.risk || '(untitled)'}</td>
                    <td>{risk.category}</td>
                    <td>{risk.probability}</td>
                    <td>{risk.impact}</td>
                    <td>{risk.status}</td>
                    <td>{risk.mitigation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {kind === 'executive' ? (
        <section className="rpt-page">
          <H>Critical verification items</H>
          <ul>
            {readiness.conflicts.slice(0, 6).map((item) => (
              <li key={item.id}>
                <strong>{item.title}.</strong> {item.explanation}
              </li>
            ))}
          </ul>
          <H>Offer position</H>
          <p>{position.explanation}</p>
        </section>
      ) : null}

      <section className="rpt-page rpt-end">
        <H>Assumptions & data quality</H>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
              <th>Source</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Purchase price</td><td className="num nowrap">{asking > 0 ? money(asking) : 'NOT PROVIDED'}</td><td>User entered</td><td>{asking > 0 ? 'Entered' : 'Missing'}</td></tr>
            <tr><td>Legal units</td><td>{deal.property.legalUnitCount || 'NOT PROVIDED'}</td><td>User underwritten</td><td>{deal.property.legalOccupancyFinding ?? 'not verified'}</td></tr>
            <tr><td>Official units</td><td>{deal.property.officialUnitCount ?? 'NOT PROVIDED'}</td><td>PLUTO</td><td>{deal.property.lastLookupAt ? 'Retrieved' : 'Not retrieved'}</td></tr>
            <tr><td>Vacancy</td><td>{deal.assumptions.combinedVacancyPercent.toFixed(2)}%</td><td>User assumption</td><td>Assumption</td></tr>
            <tr><td>Taxes</td><td className="num nowrap">{moneyOrNotProvided(deal.expenses.find((e) => e.key === 'taxes')?.annualAmount ?? 0, expenseProvided('taxes'))}</td><td>User / tax model</td><td>{expenseProvided('taxes') ? 'Entered' : 'Not provided'}</td></tr>
            <tr><td>Insurance</td><td className="num nowrap">{moneyOrNotProvided(deal.expenses.find((e) => e.key === 'insurance')?.annualAmount ?? 0, expenseProvided('insurance'))}</td><td>User entered</td><td>{expenseProvided('insurance') ? 'Entered' : 'Not provided'}</td></tr>
            <tr><td>Interest rate</td><td>{deal.loan.interestRate.toFixed(2)}%</td><td>User entered</td><td>Assumption</td></tr>
            <tr><td>Cap-rate target</td><td>{deal.assumptions.targetCapRate.toFixed(2)}%</td><td>User target</td><td>Assumption</td></tr>
            <tr><td>CoC target</td><td>{deal.assumptions.minCashOnCash.toFixed(2)}%</td><td>User target</td><td>Assumption</td></tr>
          </tbody>
        </table>
        {deal.investorNotes ? (
          <>
            <H>Investor notes</H>
            <p>{deal.investorNotes}</p>
          </>
        ) : null}
        <footer className="rpt-disclaimer">
          <p>{REPORT_DISCLAIMER}</p>
        </footer>
      </section>
    </article>
  );
}
