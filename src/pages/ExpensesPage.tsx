import { NumberField, SelectField, TextField } from '../components/fields';
import { MetricCard } from '../components/MetricCard';
import { FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { CAPEX_CATEGORIES, createCapexItem } from '../constants/defaults';
import { useDeal } from '../hooks/useDeal';
import type { CapitalExpenseItem, ExpenseBehavior, ExpenseInputMode, OperatingExpenseItem } from '../models';
import { money, pct } from '../utils/format';

export function ExpensesPage() {
  const { deal, analysis, updateDeal } = useDeal();

  const patchExpense = (id: string, partial: Partial<OperatingExpenseItem>) =>
    updateDeal((c) => ({
      ...c,
      expenses: c.expenses.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  const patchCapex = (id: string, partial: Partial<CapitalExpenseItem>) =>
    updateDeal((c) => ({
      ...c,
      capex: c.capex.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Operations and capital" title="Expenses">
        <p className="muted">
          Operating expenses feed NOI. CapEx is kept separate. Management can be underwritten even
          if you intend to self-manage.
        </p>
      </PageHeader>
      <Panel title="Operating summary">
        <MetricGrid>
          <MetricCard label="Annual operating expenses" value={money(analysis.operatingExpenses)} glossaryId="opex" />
          <MetricCard label="Monthly operating expenses" value={money(analysis.monthlyOperatingExpenses)} />
          <MetricCard label="Operating expense ratio" value={pct(analysis.operatingExpenseRatio)} glossaryId="oer" />
          <MetricCard label="NOI" value={money(analysis.noi)} glossaryId="noi" trace={analysis.traces.noi} />
        </MetricGrid>
      </Panel>
      <Panel title="Operating expenses" intro="Enter a dollar amount, or a percentage of EGI where that is the better assumption.">
        {deal.expenses.map((item) => (
          <div className="income-card" key={item.id} style={{ marginBottom: 10 }}>
            <FormGrid cols={4}>
              <TextField label="Line item" value={item.label} onChange={(label) => patchExpense(item.id, { label })} />
              <SelectField
                label="Input mode"
                value={item.mode}
                onChange={(mode) => patchExpense(item.id, { mode: mode as ExpenseInputMode })}
                options={[
                  { value: 'dollar', label: 'Dollar amount / year' },
                  { value: 'percent_egi', label: '% of EGI' },
                ]}
              />
              <SelectField
                label="Cost behavior"
                value={item.behavior ?? 'fixed'}
                onChange={(behavior) => patchExpense(item.id, { behavior: behavior as ExpenseBehavior })}
                options={[
                  { value: 'fixed', label: 'Fixed' },
                  { value: 'variable', label: 'Variable' },
                  { value: 'semi_variable', label: 'Semi-variable (50% treated as variable)' },
                ]}
              />
              {item.mode === 'dollar' ? (
                <NumberField label="Annual amount ($)" value={item.annualAmount} onChange={(annualAmount) => patchExpense(item.id, { annualAmount })} />
              ) : (
                <NumberField
                  label="Percent of EGI"
                  value={item.percentOfEgi}
                  max={100}
                  step={0.1}
                  onChange={(percentOfEgi) => patchExpense(item.id, { percentOfEgi })}
                />
              )}
              <div className="field">
                <span className="field-label">Resolved annual</span>
                <strong style={{ paddingTop: 10 }}>
                  {money(analysis.expenseDetails.find((row) => row.key === item.key)?.annualAmount ?? 0)}
                </strong>
              </div>
            </FormGrid>
          </div>
        ))}
      </Panel>
      <Panel
        title="Capital expenditures"
        intro="Major non-routine items. Immediate cost is not subtracted from NOI. Reserve contribution can be modeled here; the operating replacement-reserve line remains in OpEx if you use it."
        actions={
          <button type="button" onClick={() => updateDeal((c) => ({ ...c, capex: [...c.capex, createCapexItem()] }))}>
            Add CapEx item
          </button>
        }
      >
        {deal.capex.length === 0 ? <p className="empty-note">No CapEx items. Add roof, boiler, facade, or other work to model capital needs.</p> : null}
        {deal.capex.map((item) => (
          <article className="income-card" key={item.id}>
            <FormGrid>
              <SelectField
                label="Category"
                value={item.category}
                onChange={(category) => patchCapex(item.id, { category })}
                options={CAPEX_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <NumberField label="Immediate cost ($)" value={item.immediateCost} onChange={(immediateCost) => patchCapex(item.id, { immediateCost })} />
              <NumberField label="Expected year" value={item.expectedYear} onChange={(expectedYear) => patchCapex(item.id, { expectedYear })} />
              <NumberField label="Useful life (years)" value={item.usefulLifeYears} onChange={(usefulLifeYears) => patchCapex(item.id, { usefulLifeYears })} />
              <NumberField
                label="Annual reserve contribution ($)"
                value={item.annualReserve}
                onChange={(annualReserve) => patchCapex(item.id, { annualReserve })}
                hint="If zero, a straight-line reserve of cost ÷ useful life is shown for reference only and is not added to NOI."
              />
              <TextField label="Notes" value={item.notes} onChange={(notes) => patchCapex(item.id, { notes })} />
            </FormGrid>
            <button
              type="button"
              className="danger"
              style={{ marginTop: 10 }}
              onClick={() => updateDeal((c) => ({ ...c, capex: c.capex.filter((row) => row.id !== item.id) }))}
            >
              Remove
            </button>
          </article>
        ))}
        <p className="muted" style={{ marginTop: 12 }}>
          Immediate CapEx total: {money(analysis.immediateCapex)}. Reference annual CapEx reserve:
          {' '}{money(analysis.annualCapexReserves)}.
        </p>
      </Panel>
    </div>
  );
}
