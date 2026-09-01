import { CheckField, NumberField, SelectField, TextField } from '../components/fields';
import { MetricCard } from '../components/MetricCard';
import { Banner, FormGrid, MetricGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { OtherIncomeCategory, OtherIncomeItem, VacancyMode } from '../models';
import { createId } from '../utils/id';
import { money, pct } from '../utils/format';

const CATEGORIES: OtherIncomeCategory[] = [
  'parking',
  'laundry',
  'storage',
  'garage',
  'commercial',
  'antenna',
  'other',
];

export function IncomePage() {
  const { deal, analysis, updateDeal } = useDeal();

  const addIncome = () =>
    updateDeal((current) => ({
      ...current,
      otherIncome: [
        ...current.otherIncome,
        {
          id: createId('inc'),
          description: 'New income item',
          category: 'other',
          monthlyAmount: 0,
          verified: false,
          includeInBaseCase: false,
        },
      ],
    }));

  const patchItem = (id: string, partial: Partial<OtherIncomeItem>) =>
    updateDeal((current) => ({
      ...current,
      otherIncome: current.otherIncome.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Income statement" title="Income">
        <p className="muted">
          EGI = GRI − vacancy/collection loss + other legal income. Unverified income is shown
          separately and never enters the base case automatically.
        </p>
      </PageHeader>
      <Banner>
        Potential income is excluded from base-case underwriting until legal occupancy and permitted
        use are verified.
      </Banner>
      <Panel title="Income stack">
        <MetricGrid>
          <MetricCard label="GPR — Gross Potential Rent" value={money(analysis.gpr)} glossaryId="gpr" />
          <MetricCard label="GRI — Gross Rental Income" value={money(analysis.gri)} glossaryId="gri" />
          <MetricCard label="Vacancy loss" value={money(analysis.vacancyLoss)} />
          <MetricCard label="Collection loss" value={money(analysis.collectionLoss)} />
          <MetricCard label="Other legal income" value={money(analysis.otherLegalIncome)} />
          <MetricCard label="EGI" value={money(analysis.egi)} glossaryId="egi" trace={analysis.traces.egi} tone="emphasis" />
          <MetricCard label="Unverified / potential income (annual)" value={money(analysis.unverifiedIncomeAnnual)} tone="warn" />
        </MetricGrid>
      </Panel>
      <Panel title="Vacancy and collection loss">
        <FormGrid>
          <SelectField
            label="Assumption style"
            value={deal.assumptions.vacancyMode}
            onChange={(vacancyMode) =>
              updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, vacancyMode: vacancyMode as VacancyMode } }))
            }
            options={[
              { value: 'combined', label: 'Combined simplified percentage' },
              { value: 'detailed', label: 'Detailed vacancy + collection' },
            ]}
          />
          {deal.assumptions.vacancyMode === 'combined' ? (
            <NumberField
              label="Combined vacancy / collection (%)"
              value={deal.assumptions.combinedVacancyPercent}
              max={100}
              step={0.1}
              onChange={(combinedVacancyPercent) =>
                updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, combinedVacancyPercent } }))
              }
            />
          ) : (
            <>
              <NumberField
                label="Physical vacancy (%)"
                value={deal.assumptions.physicalVacancyPercent}
                max={100}
                step={0.1}
                onChange={(physicalVacancyPercent) =>
                  updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, physicalVacancyPercent } }))
                }
              />
              <NumberField
                label="Collection loss (%)"
                value={deal.assumptions.collectionLossPercent}
                max={100}
                step={0.1}
                onChange={(collectionLossPercent) =>
                  updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, collectionLossPercent } }))
                }
                hint="Applied to rent remaining after physical vacancy."
              />
            </>
          )}
        </FormGrid>
        <p className="muted" style={{ marginTop: 10 }}>
          Dollar impact of vacancy and collection: {money(analysis.vacancyAndCollectionLoss)} (
          {pct(analysis.gri ? analysis.vacancyAndCollectionLoss / analysis.gri : null)} of GRI)
        </p>
      </Panel>
      <Panel
        title="Other legal income"
        intro="Parking, laundry, storage, garage, commercial, antenna, and similar recurring items. Must be verified and flagged for the base case."
        actions={<button type="button" onClick={addIncome}>Add income item</button>}
      >
        {deal.otherIncome.length === 0 ? <p className="empty-note">No other income items yet.</p> : null}
        {deal.otherIncome.map((item) => (
          <article className="income-card" key={item.id}>
            <FormGrid>
              <TextField label="Description" value={item.description} onChange={(description) => patchItem(item.id, { description })} />
              <SelectField
                label="Category"
                value={item.category}
                onChange={(category) => patchItem(item.id, { category: category as OtherIncomeCategory })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <NumberField label="Monthly amount ($)" value={item.monthlyAmount} onChange={(monthlyAmount) => patchItem(item.id, { monthlyAmount })} />
            </FormGrid>
            <div className="form-grid cols-2" style={{ marginTop: 10 }}>
              <CheckField label="Verified" checked={item.verified} onChange={(verified) => patchItem(item.id, { verified })} />
              <CheckField
                label="Included in base case"
                checked={item.includeInBaseCase}
                onChange={(includeInBaseCase) => patchItem(item.id, { includeInBaseCase })}
                hint="Ignored unless also verified."
              />
            </div>
            <button
              type="button"
              className="danger"
              style={{ marginTop: 10 }}
              onClick={() =>
                updateDeal((c) => ({ ...c, otherIncome: c.otherIncome.filter((row) => row.id !== item.id) }))
              }
            >
              Remove
            </button>
          </article>
        ))}
      </Panel>
      <Panel title="Excluded potential income">
        <p>
          This income is excluded until legal occupancy and permitted residential use are verified.
        </p>
        {(analysis.excludedIncomeDetail ?? []).length === 0 ? (
          <p className="empty-note">No excluded unit or potential-income lines.</p>
        ) : (
          <table>
            <tbody>
              {(analysis.excludedIncomeDetail ?? []).map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{money(row.annual)} / year</td>
                </tr>
              ))}
              <tr>
                <td>Excluded from base case</td>
                <td className="num">{money(analysis.unverifiedIncomeAnnual)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <NumberField
          label="Potential basement / unverified monthly income ($)"
          value={deal.unverifiedIncomeMonthly}
          onChange={(unverifiedIncomeMonthly) => updateDeal((c) => ({ ...c, unverifiedIncomeMonthly }))}
          hint="Shown separately. Never added to base-case GRI automatically."
        />
        <CheckField
          label="Include unverified income in the Upside scenario only"
          checked={deal.assumptions.includeUnverifiedInUpside}
          onChange={(includeUnverifiedInUpside) =>
            updateDeal((c) => ({ ...c, assumptions: { ...c.assumptions, includeUnverifiedInUpside } }))
          }
          hint="Requires an explicit check. Never applied to Conservative or Base."
        />
      </Panel>
    </div>
  );
}
