import { CheckField, NumberField } from '../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { ScenarioAdjustments, ScenarioName, SensitivityRow } from '../models';
import { money, pct, ratio } from '../utils/format';

const NAMES: ScenarioName[] = ['conservative', 'base', 'upside'];

function SensitivityTable({ rows }: { rows: SensitivityRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Case</th>
            <th className="num">NOI</th>
            <th className="num">Cap Rate</th>
            <th className="num">P&I</th>
            <th className="num">Debt Service</th>
            <th className="num">DSCR</th>
            <th className="num">Cash Flow</th>
            <th className="num">CoC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="num">{money(row.noi ?? 0)}</td>
              <td className="num">{pct(row.capRate ?? null)}</td>
              <td className="num">{money(row.monthlyPI)}</td>
              <td className="num">{money(row.annualDebtService)}</td>
              <td className="num">{ratio(row.dscr)}</td>
              <td className="num">{money(row.cashFlow)}</td>
              <td className="num">{pct(row.cashOnCash)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScenariosPage() {
  const { deal, analysis, updateDeal } = useDeal();

  const patchScenario = (name: ScenarioName, partial: Partial<ScenarioAdjustments>) =>
    updateDeal((c) => ({
      ...c,
      scenarios: { ...c.scenarios, [name]: { ...c.scenarios[name], ...partial } },
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="What-if analysis" title="Scenarios & sensitivity">
        <p className="muted">
          Conservative, Base, and Upside adjust the same engine. Unverified income never enters
          Upside unless you enable it.
        </p>
      </PageHeader>
      <Banner>
        Potential income is excluded from base-case underwriting until legal occupancy and permitted
        use are verified.
      </Banner>
      <Panel title="Scenario controls">
        <CheckField
          label="Include unverified income in Upside only"
          checked={deal.assumptions.includeUnverifiedInUpside}
          onChange={(includeUnverifiedInUpside) =>
            updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, includeUnverifiedInUpside } }))
          }
        />
        <div className="grid-3" style={{ marginTop: 12 }}>
          {NAMES.map((name) => {
            const s = deal.scenarios[name];
            return (
              <div key={name} className="income-card">
                <h3>{name === 'base' ? 'Base' : name === 'conservative' ? 'Conservative' : 'Upside'}</h3>
                <p className="small muted">
                  Vacancy: {s.vacancyPercentOverride === null ? 'INHERITED' : 'OVERRIDDEN'} · Rate:{' '}
                  {s.interestRateOverride === null ? 'INHERITED' : 'OVERRIDDEN'}
                </p>
                <FormGrid cols={2}>
                  <NumberField label="Rent multiplier" value={s.rentMultiplier} step={0.01} min={0} onChange={(rentMultiplier) => patchScenario(name, { rentMultiplier })} />
                  <NumberField label="Expense multiplier" value={s.expenseMultiplier} step={0.01} min={0} onChange={(expenseMultiplier) => patchScenario(name, { expenseMultiplier })} />
                  <CheckField
                    label="Override vacancy"
                    checked={s.vacancyPercentOverride !== null}
                    onChange={(on) =>
                      patchScenario(name, {
                        vacancyPercentOverride: on ? deal.assumptions.combinedVacancyPercent : null,
                      })
                    }
                  />
                  {s.vacancyPercentOverride !== null ? (
                    <NumberField
                      label="Vacancy override % (OVERRIDDEN)"
                      value={s.vacancyPercentOverride}
                      min={0}
                      max={100}
                      step={0.1}
                      onChange={(v) => patchScenario(name, { vacancyPercentOverride: v })}
                    />
                  ) : (
                    <p className="small muted">Vacancy INHERITED from base assumptions.</p>
                  )}
                  <CheckField
                    label="Override interest rate"
                    checked={s.interestRateOverride !== null}
                    onChange={(on) =>
                      patchScenario(name, {
                        interestRateOverride: on ? deal.loan.interestRate : null,
                      })
                    }
                  />
                  {s.interestRateOverride !== null ? (
                    <NumberField
                      label="Rate override % (OVERRIDDEN)"
                      value={s.interestRateOverride}
                      min={0}
                      step={0.01}
                      onChange={(v) => patchScenario(name, { interestRateOverride: v })}
                    />
                  ) : (
                    <p className="small muted">Rate INHERITED from the loan.</p>
                  )}
                </FormGrid>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Side-by-side results">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Conservative</th>
                <th className="num">Base</th>
                <th className="num">Upside</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['GRI', 'gri', money],
                  ['EGI', 'egi', money],
                  ['NOI', 'noi', money],
                  ['Cap Rate', 'capRate', pct],
                  ['DSCR', 'dscr', ratio],
                  ['Cash Flow', 'cashFlow', money],
                  ['CoC', 'cashOnCash', pct],
                  ['Debt Yield', 'debtYield', pct],
                  ['Value @ target cap', 'supportedValue', money],
                  ['Conservative max offer', 'maxOffer', money],
                ] as const
              ).map(([label, key, fmt]) => (
                <tr key={key}>
                  <td>{label}</td>
                  {NAMES.map((name) => (
                    <td key={name} className="num">
                      {fmt(analysis.scenarios[name][key] as never)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td>Unverified income included</td>
                {NAMES.map((name) => (
                  <td key={name} className="num">
                    {analysis.scenarios[name].includesUnverifiedIncome ? 'Yes' : 'No'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Interest-rate sensitivity">
        <SensitivityTable rows={analysis.interestSensitivity} />
      </Panel>
      <Panel title="Rent sensitivity">
        <SensitivityTable rows={analysis.rentSensitivity} />
      </Panel>
      <Panel title="Expense sensitivity">
        <SensitivityTable rows={analysis.expenseSensitivity} />
      </Panel>
      <Panel title="Purchase-price sensitivity">
        <SensitivityTable rows={analysis.priceSensitivity} />
      </Panel>
    </div>
  );
}
