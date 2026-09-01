import { CheckField, NumberField, SelectField, TextField } from '../components/fields';
import { MetricCard } from '../components/MetricCard';
import { FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { LoanType } from '../models';
import { money, pct, pctPoints, ratio } from '../utils/format';

const LOAN_TYPES: { value: LoanType; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA (where applicable)' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'dscr', label: 'DSCR loan' },
  { value: 'private', label: 'Private lender' },
  { value: 'hard_money', label: 'Hard money' },
  { value: 'seller', label: 'Seller financing' },
  { value: 'custom', label: 'Custom' },
];

export function FinancingPage() {
  const { deal, analysis, updateDeal } = useDeal();
  const loan = deal.loan;
  const a = deal.acquisition;

  const patchLoan = (partial: Partial<typeof loan>) =>
    updateDeal((c) => ({ ...c, loan: { ...c.loan, ...partial } }));
  const patchAcq = (partial: Partial<typeof a>) =>
    updateDeal((c) => ({ ...c, acquisition: { ...c.acquisition, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Debt and cash to close" title="Financing">
        <p className="muted">
          Loan-type labels do not encode hidden qualification rules. DSCR and LTV targets on the
          Settings / Valuation screens are user underwriting assumptions.
        </p>
      </PageHeader>
      <Panel title="Loan structure">
        <FormGrid>
          <SelectField
            label="Loan type"
            value={loan.loanType}
            onChange={(loanType) => patchLoan({ loanType: loanType as LoanType })}
            options={LOAN_TYPES}
          />
          <NumberField label="Purchase price ($)" value={loan.purchasePrice} onChange={(purchasePrice) => patchLoan({ purchasePrice })} />
          <NumberField
            label="Down payment (%)"
            value={loan.downPaymentPercent}
            max={100}
            step={0.1}
            onChange={(downPaymentPercent) => patchLoan({ downPaymentPercent, useManualLoanAmount: false })}
          />
          <NumberField
            label="Interest rate (%)"
            value={loan.interestRate}
            step={0.01}
            onChange={(interestRate) => patchLoan({ interestRate })}
          />
          <NumberField label="Loan term (years)" value={loan.loanTermYears} min={1} max={50} onChange={(loanTermYears) => patchLoan({ loanTermYears })} />
          <SelectField
            label="Amortization preset"
            value={['15', '20', '25', '30'].includes(String(loan.amortizationYears)) ? String(loan.amortizationYears) : 'custom'}
            onChange={(value) => {
              if (value === 'custom') return;
              patchLoan({ amortizationYears: Number(value) });
            }}
            options={[
              { value: '15', label: '15-year' },
              { value: '20', label: '20-year' },
              { value: '25', label: '25-year' },
              { value: '30', label: '30-year' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <NumberField
            label="Amortization period (years)"
            value={loan.amortizationYears}
            min={1}
            max={50}
            onChange={(amortizationYears) => patchLoan({ amortizationYears })}
          />
          <NumberField
            label="Interest-only period (months)"
            value={loan.interestOnlyMonths}
            onChange={(interestOnlyMonths) => patchLoan({ interestOnlyMonths })}
          />
          <NumberField label="Points (%)" value={loan.points} step={0.125} onChange={(points) => patchLoan({ points })} />
          <NumberField label="Lender fees ($)" value={loan.lenderFees} onChange={(lenderFees) => patchLoan({ lenderFees })} />
          <TextField
            label="First payment date (optional)"
            value={loan.startDate ?? ''}
            onChange={(startDate) => patchLoan({ startDate })}
            placeholder="YYYY-MM-DD"
          />
        </FormGrid>
        <CheckField
          label="Enter loan amount manually"
          checked={loan.useManualLoanAmount}
          onChange={(useManualLoanAmount) => patchLoan({ useManualLoanAmount })}
          hint="Otherwise loan = purchase price × (1 − down payment %)."
        />
        {loan.useManualLoanAmount ? (
          <NumberField label="Loan amount ($)" value={loan.loanAmount} onChange={(loanAmount) => patchLoan({ loanAmount })} />
        ) : null}
      </Panel>
      <Panel title="Computed financing">
        <MetricGrid>
          <MetricCard label="Down payment" value={money(analysis.downPayment)} />
          <MetricCard label="Loan amount" value={money(analysis.loanAmount)} />
          <MetricCard label="LTV (÷ purchase price)" value={pct(analysis.ltv)} glossaryId="ltv" trace={analysis.traces.ltv} />
          <MetricCard label="LTC (÷ total project cost)" value={pct(analysis.ltc)} glossaryId="ltc" />
          <MetricCard label="Monthly P&I" value={money(analysis.monthlyPI)} glossaryId="pi" />
          <MetricCard label="Annual debt service" value={money(analysis.annualDebtService)} glossaryId="debt-service" />
          <MetricCard label="Year-1 principal reduction" value={money(analysis.amortization.year1Principal)} />
          <MetricCard label="Year-1 interest" value={money(analysis.amortization.year1Interest)} />
          <MetricCard label="Total interest (full amort.)" value={money(analysis.amortization.totalInterest)} />
          <MetricCard label="Remaining balance at maturity" value={money(analysis.amortization.remainingBalance)} />
          <MetricCard label="5-year balance" value={money(analysis.amortization.year5Balance ?? null)} />
          <MetricCard label="10-year balance" value={money(analysis.amortization.year10Balance ?? null)} />
          {deal.loan.loanTermYears < deal.loan.amortizationYears ? (
            <MetricCard
              label="Balloon / remaining at term"
              value={money(analysis.amortization.remainingBalance)}
            />
          ) : null}
          <MetricCard label="Points + lender fees" value={money(analysis.financingFees)} />
        </MetricGrid>
      </Panel>
      <Panel title="Acquisition costs" intro="Enter buyer-paid amounts only. Seller-paid items should be left at zero. Nothing is assumed automatically.">
        <FormGrid>
          <NumberField label="Attorney ($)" value={a.attorney} onChange={(attorney) => patchAcq({ attorney })} />
          <NumberField label="Inspection ($)" value={a.inspection} onChange={(inspection) => patchAcq({ inspection })} />
          <NumberField label="Appraisal ($)" value={a.appraisal} onChange={(appraisal) => patchAcq({ appraisal })} />
          <NumberField label="Mortgage-related costs ($)" value={a.mortgageRelated} onChange={(mortgageRelated) => patchAcq({ mortgageRelated })} />
          <NumberField label="Title ($)" value={a.title} onChange={(title) => patchAcq({ title })} />
          <NumberField label="Recording ($)" value={a.recording} onChange={(recording) => patchAcq({ recording })} />
          <NumberField label="Transfer-related ($)" value={a.transfer} onChange={(transfer) => patchAcq({ transfer })} />
          <NumberField label="Broker (if buyer-paid) ($)" value={a.broker} onChange={(broker) => patchAcq({ broker })} />
          <NumberField label="Escrow requirements ($)" value={a.escrow} onChange={(escrow) => patchAcq({ escrow })} />
          <NumberField label="Other closing costs ($)" value={a.otherClosing} onChange={(otherClosing) => patchAcq({ otherClosing })} />
          <NumberField label="Initial reserves ($)" value={a.initialReserves} onChange={(initialReserves) => patchAcq({ initialReserves })} />
          <NumberField label="Renovation budget ($)" value={a.renovationBudget} onChange={(renovationBudget) => patchAcq({ renovationBudget })} />
        </FormGrid>
        <table style={{ marginTop: 14 }}>
          <tbody>
            <tr>
              <td>Buyer closing costs</td>
              <td className="num">{money(analysis.buyerClosingCosts)}</td>
            </tr>
            <tr>
              <td>Total acquisition cost</td>
              <td className="num">{money(analysis.totalAcquisitionCost)}</td>
            </tr>
            <tr>
              <td>Total cash required</td>
              <td className="num">{money(analysis.totalCashInvested)}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
      {(analysis.financingCompare ?? []).length > 0 ? (
        <Panel title="Financing comparison (user-configured alternatives, not lender rules)">
          <table>
            <thead>
              <tr>
                <th>Structure</th>
                <th className="num">P&I</th>
                <th className="num">Debt service</th>
                <th className="num">DSCR</th>
                <th className="num">Cash flow</th>
                <th className="num">CoC</th>
              </tr>
            </thead>
            <tbody>
              {analysis.financingCompare?.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.monthlyPI)}</td>
                  <td className="num">{money(row.annualDebtService)}</td>
                  <td className="num">{ratio(row.dscr)}</td>
                  <td className="num">{money(row.cashFlow)}</td>
                  <td className="num">{pct(row.cashOnCash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      <Panel title="Amortization schedule (first 24 months)">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Payment</th>
                <th className="num">Principal</th>
                <th className="num">Interest</th>
                <th className="num">Balance</th>
                <th>IO</th>
              </tr>
            </thead>
            <tbody>
              {analysis.amortization.schedule.slice(0, 24).map((row) => (
                <tr key={row.period}>
                  <td>{row.period}</td>
                  <td className="num">{money(row.payment)}</td>
                  <td className="num">{money(row.principal)}</td>
                  <td className="num">{money(row.interest)}</td>
                  <td className="num">{money(row.balance)}</td>
                  <td>{row.interestOnly ? 'Yes' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Contract term {loan.loanTermYears} years · amortization {loan.amortizationYears} years.
          {loan.loanTermYears < loan.amortizationYears
            ? ` Balloon / remaining balance after the contract term is estimated from the schedule at month ${loan.loanTermYears * 12}: ${money(analysis.amortization.schedule[Math.min(loan.loanTermYears * 12, analysis.amortization.schedule.length) - 1]?.balance ?? 0)}.`
            : ''}
        </p>
      </Panel>
      <p className="small muted">Amortization presets used in underwriting: 15, 20, 25, 30, or custom. Rate shown as {pctPoints(loan.interestRate)}.</p>
    </div>
  );
}
