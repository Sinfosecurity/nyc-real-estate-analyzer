import { useState } from 'react';
import { NumberField } from '../../components/fields';
import { ExplainBlock, LearnLink } from '../../components/guided/chrome';
import { FormGrid, PageHeader, Panel } from '../../components/ui';
import { useDeal } from '../../hooks/useDeal';
import { money } from '../../utils/format';

type BuyStyle = 'mortgage' | 'cash' | 'custom';

export function StepFinancing() {
  const { deal, analysis, updateDeal } = useDeal();
  const loan = deal.loan;
  const [style, setStyle] = useState<BuyStyle>(loan.downPaymentPercent >= 100 ? 'cash' : 'mortgage');

  const patchLoan = (partial: Partial<typeof loan>) =>
    updateDeal((c) => ({ ...c, loan: { ...c.loan, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 5 of 8" title="How are you planning to buy it?">
        <p className="muted">Choose a simple structure. Lender rules are not encoded unless you type them.</p>
        <LearnLink to="/learn?topic=financing">Learn: DSCR and mortgage payments</LearnLink>
      </PageHeader>
      <div className="choice-row">
        {(
          [
            ['mortgage', 'Mortgage'],
            ['cash', 'Cash purchase'],
            ['custom', 'Custom financing'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={style === id ? 'btn-xl' : 'secondary btn-xl'}
            onClick={() => {
              setStyle(id);
              if (id === 'cash') patchLoan({ downPaymentPercent: 100, useManualLoanAmount: false });
              if (id === 'mortgage' && loan.downPaymentPercent >= 100) patchLoan({ downPaymentPercent: 25 });
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Panel title="Purchase and cash to close">
        <FormGrid>
          <NumberField label="Purchase price ($)" value={loan.purchasePrice} onChange={(purchasePrice) => patchLoan({ purchasePrice })} />
          {style !== 'cash' ? (
            <>
              <NumberField
                label="Down payment (%)"
                value={loan.downPaymentPercent}
                max={100}
                step={0.5}
                onChange={(downPaymentPercent) => patchLoan({ downPaymentPercent, useManualLoanAmount: false })}
              />
              <NumberField label="Interest rate (%)" value={loan.interestRate} step={0.01} onChange={(interestRate) => patchLoan({ interestRate })} />
              <NumberField label="Loan term (years)" value={loan.loanTermYears} onChange={(loanTermYears) => patchLoan({ loanTermYears })} />
              <NumberField
                label="Amortization (years)"
                value={loan.amortizationYears}
                onChange={(amortizationYears) => patchLoan({ amortizationYears })}
              />
            </>
          ) : null}
          <NumberField
            label="Closing costs ($)"
            value={analysis.buyerClosingCosts}
            onChange={(total) =>
              updateDeal((c) => ({
                ...c,
                acquisition: { ...c.acquisition, otherClosing: Math.max(0, total - 11250) },
              }))
            }
          />
          <NumberField label="Loan fees ($)" value={loan.lenderFees} onChange={(lenderFees) => patchLoan({ lenderFees })} />
          <NumberField
            label="Renovation budget ($)"
            value={deal.acquisition.renovationBudget}
            onChange={(renovationBudget) =>
              updateDeal((c) => ({ ...c, acquisition: { ...c.acquisition, renovationBudget } }))
            }
          />
          <NumberField
            label="Cash reserves ($)"
            value={deal.acquisition.initialReserves}
            onChange={(initialReserves) =>
              updateDeal((c) => ({ ...c, acquisition: { ...c.acquisition, initialReserves } }))
            }
          />
        </FormGrid>
      </Panel>
      <Panel title="What this financing means">
        <div className="metric-grid">
          <article className="metric-card">
            <div className="metric-label">Loan amount</div>
            <div className="metric-value">{money(analysis.loanAmount)}</div>
          </article>
          <article className="metric-card">
            <div className="metric-label">Monthly payment</div>
            <div className="metric-value">{money(analysis.monthlyPI)}</div>
          </article>
          <article className="metric-card tone-emphasis">
            <div className="metric-label">Total cash required</div>
            <div className="metric-value">{money(analysis.totalCashInvested)}</div>
          </article>
        </div>
        <ExplainBlock
          title="DSCR — Debt Service Coverage Ratio"
          meaning="How many dollars of NOI the property produces for each dollar of annual mortgage payments."
          formula="NOI ÷ Annual Debt Service"
          why="A number below 1.00 means operations do not fully cover the mortgage."
        >
          <p>
            {money(analysis.noi)} ÷ {money(analysis.annualDebtService)} = {analysis.dscr?.toFixed(2) ?? 'N/A'}
          </p>
        </ExplainBlock>
      </Panel>
    </div>
  );
}
