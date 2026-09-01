import { CheckField, NumberField, SelectField, TextField } from '../components/fields';
import { FormulaBlock, MetricCard } from '../components/MetricCard';
import { FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { RenovationLine } from '../models';
import { createId } from '../utils/id';
import { money, pct } from '../utils/format';

export function RenovationPage() {
  const { deal, analysis, updateDeal } = useDeal();
  const r = deal.renovation;
  const patch = (partial: Partial<typeof r>) =>
    updateDeal((c) => ({ ...c, renovation: { ...c.renovation, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Value-add" title="Renovation">
        <p className="muted">
          Value created = NOI increase ÷ target cap rate. Compare that estimate with renovation
          cost. This is not an appraisal.
        </p>
      </PageHeader>
      <Panel title="Plan">
        <CheckField label="Include renovation in this deal’s analysis narrative" checked={r.enabled} onChange={(enabled) => patch({ enabled })} />
        <FormGrid>
          <div className="field">
            <span className="field-label">Current legal monthly rent</span>
            <strong>{money(analysis.gri / 12)}</strong>
            <span className="field-hint">Read-only from the legal rent roll (GRI ÷ 12).</span>
          </div>
          <NumberField label="Projected legal monthly rent ($)" value={r.projectedMonthlyRent} onChange={(projectedMonthlyRent) => patch({ projectedMonthlyRent })} />
          <NumberField label="Renovation cost ($)" value={r.renovationCost} onChange={(renovationCost) => patch({ renovationCost })} />
          <NumberField label="Renovation period (months)" value={r.renovationMonths} onChange={(renovationMonths) => patch({ renovationMonths })} />
          <NumberField
            label="Vacancy during renovation (%)"
            value={r.vacancyDuringRenoPercent}
            max={100}
            onChange={(vacancyDuringRenoPercent) => patch({ vacancyDuringRenoPercent })}
          />
          <NumberField
            label="Projected annual operating expenses ($)"
            value={r.projectedAnnualExpenses}
            onChange={(projectedAnnualExpenses) => patch({ projectedAnnualExpenses })}
            hint="Leave 0 to reuse current operating expenses."
          />
          <NumberField label="Target cap rate for value created (%)" value={r.targetCapRate} step={0.1} onChange={(targetCapRate) => patch({ targetCapRate })} />
        </FormGrid>
      </Panel>
      <Panel
        title="Renovation schedule"
        intro="Line-item scope. Value created remains income-approach (NOI increase ÷ target cap), not guaranteed market appreciation."
        actions={
          <button
            type="button"
            onClick={() =>
              updateDeal((c) => ({
                ...c,
                renovationLines: [
                  ...(c.renovationLines ?? []),
                  {
                    id: createId('reno'),
                    scope: '',
                    category: 'Interior',
                    cost: 0,
                    contingencyPercent: 10,
                    start: '',
                    durationMonths: 0,
                    monthlyRentImpact: 0,
                    status: 'planned',
                  },
                ],
              }))
            }
          >
            Add line
          </button>
        }
      >
        {(deal.renovationLines ?? []).length === 0 ? <p className="empty-note">No schedule lines yet.</p> : null}
        {(deal.renovationLines ?? []).map((line) => (
          <article className="income-card" key={line.id}>
            <FormGrid>
              <TextField
                label="Scope"
                value={line.scope}
                onChange={(scope) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, scope } : item,
                    ),
                  }))
                }
              />
              <TextField
                label="Category"
                value={line.category}
                onChange={(category) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, category } : item,
                    ),
                  }))
                }
              />
              <NumberField
                label="Cost ($)"
                value={line.cost}
                onChange={(cost) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, cost } : item,
                    ),
                  }))
                }
              />
              <NumberField
                label="Contingency (%)"
                value={line.contingencyPercent}
                onChange={(contingencyPercent) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, contingencyPercent } : item,
                    ),
                  }))
                }
              />
              <TextField
                label="Start"
                value={line.start}
                onChange={(start) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, start } : item,
                    ),
                  }))
                }
              />
              <NumberField
                label="Duration (months)"
                value={line.durationMonths}
                onChange={(durationMonths) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, durationMonths } : item,
                    ),
                  }))
                }
              />
              <NumberField
                label="Monthly rent impact ($)"
                value={line.monthlyRentImpact}
                onChange={(monthlyRentImpact) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, monthlyRentImpact } : item,
                    ),
                  }))
                }
              />
              <SelectField
                label="Status"
                value={line.status}
                onChange={(status) =>
                  updateDeal((c) => ({
                    ...c,
                    renovationLines: (c.renovationLines ?? []).map((item) =>
                      item.id === line.id ? { ...item, status: status as RenovationLine['status'] } : item,
                    ),
                  }))
                }
                options={[
                  { value: 'planned', label: 'Planned' },
                  { value: 'in_progress', label: 'In progress' },
                  { value: 'complete', label: 'Complete' },
                ]}
              />
            </FormGrid>
            <button
              type="button"
              className="danger"
              style={{ marginTop: 8 }}
              onClick={() =>
                updateDeal((c) => ({
                  ...c,
                  renovationLines: (c.renovationLines ?? []).filter((item) => item.id !== line.id),
                }))
              }
            >
              Remove
            </button>
          </article>
        ))}
        {(() => {
          const lines = deal.renovationLines ?? [];
          const hard = lines.reduce((sum, line) => sum + line.cost, 0);
          const withContingency = lines.reduce(
            (sum, line) => sum + line.cost * (1 + line.contingencyPercent / 100),
            0,
          );
          const rentImpact = lines.reduce((sum, line) => sum + line.monthlyRentImpact, 0);
          return (
            <p className="muted">
              Schedule hard cost {money(hard)} · with contingency {money(withContingency)} · monthly
              rent impact {money(rentImpact)}. Use Apply to copy the contingency total into renovation
              cost.
            </p>
          );
        })()}
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const withContingency = (deal.renovationLines ?? []).reduce(
              (sum, line) => sum + line.cost * (1 + line.contingencyPercent / 100),
              0,
            );
            const rentImpact = (deal.renovationLines ?? []).reduce((sum, line) => sum + line.monthlyRentImpact, 0);
            patch({
              renovationCost: withContingency,
              projectedMonthlyRent: rentImpact > 0 ? analysis.gri / 12 + rentImpact : r.projectedMonthlyRent,
            });
          }}
        >
          Apply schedule to renovation cost
        </button>
      </Panel>
      <Panel title="Value-add results">
        <MetricGrid>
          <MetricCard label="Current NOI" value={money(analysis.renovation.currentNoi)} />
          <MetricCard label="Projected NOI" value={money(analysis.renovation.projectedNoi)} />
          <MetricCard label="NOI increase" value={money(analysis.renovation.noiIncrease)} tone="emphasis" />
          <MetricCard label="Estimated value created" value={money(analysis.renovation.valueCreated)} />
          <MetricCard label="Renovation cost" value={money(analysis.renovation.renovationCost)} />
          <MetricCard label="Value created − cost" value={money(analysis.renovation.valueVsCost)} />
          <MetricCard label="Return on renovation capital" value={pct(analysis.renovation.returnOnRenovationCapital)} />
          <MetricCard label="Holding vacancy loss (illustrative)" value={money(analysis.renovation.holdingVacancyLoss)} />
        </MetricGrid>
        {analysis.renovation.traces.map((trace) => (
          <FormulaBlock key={trace.title} trace={trace} />
        ))}
      </Panel>
    </div>
  );
}
