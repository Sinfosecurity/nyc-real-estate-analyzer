import { CheckField, NumberField, SelectField, TextField } from '../../components/fields';
import { ExplainBlock, LearnLink } from '../../components/guided/chrome';
import { Banner, FormGrid, PageHeader, Panel } from '../../components/ui';
import { createUnit } from '../../constants/defaults';
import { useDeal } from '../../hooks/useDeal';
import type { IncomeStatus, OccupancyStatus, OtherIncomeCategory, RentRegulationStatus, SpaceType, Unit } from '../../models';
import {
  excludedMonthlyRent,
  exclusionReason,
  excludedUnitList,
  includedUnits,
  potentialMonthlyRent,
  verifiedMonthlyRent,
  whyNumbersAreLow,
} from '../../ux/narrative';
import { createId } from '../../utils/id';
import { money } from '../../utils/format';

export function StepIncome() {
  const { deal, analysis, updateDeal } = useDeal();
  const why = whyNumbersAreLow(deal);

  const updateUnit = (id: string, partial: Partial<Unit>) =>
    updateDeal((c) => ({
      ...c,
      units: c.units.map((unit) => (unit.id === id ? { ...unit, ...partial } : unit)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 3 of 8" title="How much income can this property legally produce?">
        <p className="muted">
          Only verified or user-attested permitted units enter the conservative base case.
        </p>
        <LearnLink to="/learn?topic=income">Learn: verified rent vs potential rent</LearnLink>
      </PageHeader>

      <div className="metric-grid">
        <article className="metric-card tone-emphasis">
          <div className="metric-label">Verified base-case rent</div>
          <div className="metric-value">{money(verifiedMonthlyRent(deal))}/mo</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Potential additional rent</div>
          <div className="metric-value">{money(Math.max(0, potentialMonthlyRent(deal) - verifiedMonthlyRent(deal)))}/mo</div>
        </article>
        <article className="metric-card tone-warn">
          <div className="metric-label">Excluded from base case</div>
          <div className="metric-value">{money(excludedMonthlyRent(deal))}/mo</div>
        </article>
      </div>

      {why ? (
        <Banner tone="danger">
          <h3>Why are my numbers so low?</h3>
          <p>{why}</p>
          <p>
            <strong>Included:</strong>{' '}
            {includedUnits(deal)
              .map((u) => `Unit ${u.identifier} — ${money(u.underwrittenMonthlyRent || u.currentMonthlyRent)}`)
              .join('; ') || 'None'}
          </p>
          <p>
            <strong>Excluded:</strong>{' '}
            {excludedUnitList(deal)
              .map((u) => `Unit ${u.identifier} — ${money(u.underwrittenMonthlyRent || u.currentMonthlyRent)} (${exclusionReason(u)})`)
              .join('; ') || 'None'}
          </p>
        </Banner>
      ) : null}

      <Panel
        title="Units"
        actions={
          <button
            type="button"
            className="btn-xl"
            onClick={() =>
              updateDeal((c) => ({
                ...c,
                units: [...c.units, createUnit({ identifier: String(c.units.length + 1), legalOccupancyVerified: false, incomeStatus: 'unverified' })],
              }))
            }
          >
            + Add Unit
          </button>
        }
      >
        {deal.units.map((unit) => {
          const included = includedUnits(deal).some((u) => u.id === unit.id);
          return (
            <article className="unit-card" key={unit.id}>
              <div className="card-toolbar">
                <h3>Unit {unit.identifier}</h3>
                {!included ? <span className="imp-badge imp-verify">⚠ Not verified — excluded</span> : <span className="imp-badge imp-retrieved">In base case</span>}
              </div>
              {!included ? (
                <p className="small">
                  This unit's income will not be included in the conservative base case until its
                  permitted residential use is verified.
                </p>
              ) : null}
              <FormGrid>
                <TextField label="Label" value={unit.identifier} onChange={(identifier) => updateUnit(unit.id, { identifier })} />
                <NumberField
                  label="Monthly rent ($)"
                  value={unit.underwrittenMonthlyRent}
                  onChange={(underwrittenMonthlyRent) =>
                    updateUnit(unit.id, {
                      underwrittenMonthlyRent,
                      currentMonthlyRent: unit.currentMonthlyRent || underwrittenMonthlyRent,
                      marketMonthlyRent: unit.marketMonthlyRent || underwrittenMonthlyRent,
                    })
                  }
                />
                <SelectField
                  label="Occupancy"
                  value={unit.occupancyStatus}
                  onChange={(occupancyStatus) => updateUnit(unit.id, { occupancyStatus: occupancyStatus as OccupancyStatus })}
                  options={[
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'vacant', label: 'Vacant' },
                    { value: 'notice', label: 'Notice given' },
                  ]}
                />
                <SelectField
                  label="Rent status"
                  value={unit.incomeStatus ?? 'unverified'}
                  onChange={(incomeStatus) =>
                    updateUnit(unit.id, {
                      incomeStatus: incomeStatus as IncomeStatus,
                      legalOccupancyVerified: incomeStatus === 'verified' || incomeStatus === 'user_attested',
                    })
                  }
                  options={[
                    { value: 'verified', label: 'Verified' },
                    { value: 'user_attested', label: 'User attested' },
                    { value: 'unverified', label: 'Unverified' },
                    { value: 'potentially_non_conforming', label: 'Potentially non-conforming' },
                    { value: 'excluded', label: 'Excluded' },
                  ]}
                />
                <SelectField
                  label="Regulation"
                  value={unit.rentRegulationStatus ?? 'unknown'}
                  onChange={(rentRegulationStatus) =>
                    updateUnit(unit.id, { rentRegulationStatus: rentRegulationStatus as RentRegulationStatus })
                  }
                  options={[
                    { value: 'unknown', label: 'Unknown' },
                    { value: 'market', label: 'Market rate' },
                    { value: 'stabilized', label: 'Rent stabilized' },
                    { value: 'controlled', label: 'Rent controlled' },
                  ]}
                />
                <SelectField
                  label="Space type"
                  value={unit.spaceType ?? 'primary'}
                  onChange={(spaceType) => updateUnit(unit.id, { spaceType: spaceType as SpaceType })}
                  options={[
                    { value: 'primary', label: 'Primary dwelling' },
                    { value: 'basement', label: 'Basement' },
                    { value: 'cellar', label: 'Cellar' },
                    { value: 'attic', label: 'Attic' },
                    { value: 'garage', label: 'Garage' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </FormGrid>
              <button
                type="button"
                className="danger"
                style={{ marginTop: 10 }}
                onClick={() => updateDeal((c) => ({ ...c, units: c.units.filter((u) => u.id !== unit.id) }))}
              >
                Remove unit
              </button>
            </article>
          );
        })}
      </Panel>

      <Panel title="Other income">
        <p className="muted">Parking, laundry, storage, garage, or similar. Unverified items stay out of the base case.</p>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            updateDeal((c) => ({
              ...c,
              otherIncome: [
                ...c.otherIncome,
                {
                  id: createId('inc'),
                  description: 'Other income',
                  category: 'other',
                  monthlyAmount: 0,
                  verified: false,
                  includeInBaseCase: false,
                },
              ],
            }))
          }
        >
          Add other income
        </button>
        {deal.otherIncome.map((item) => (
          <article className="income-card" key={item.id} style={{ marginTop: 10 }}>
            <FormGrid>
              <TextField
                label="Description"
                value={item.description}
                onChange={(description) =>
                  updateDeal((c) => ({
                    ...c,
                    otherIncome: c.otherIncome.map((row) => (row.id === item.id ? { ...row, description } : row)),
                  }))
                }
              />
              <SelectField
                label="Type"
                value={item.category}
                onChange={(category) =>
                  updateDeal((c) => ({
                    ...c,
                    otherIncome: c.otherIncome.map((row) =>
                      row.id === item.id ? { ...row, category: category as OtherIncomeCategory } : row,
                    ),
                  }))
                }
                options={['parking', 'laundry', 'storage', 'garage', 'other'].map((c) => ({ value: c, label: c }))}
              />
              <NumberField
                label="Monthly amount ($)"
                value={item.monthlyAmount}
                onChange={(monthlyAmount) =>
                  updateDeal((c) => ({
                    ...c,
                    otherIncome: c.otherIncome.map((row) => (row.id === item.id ? { ...row, monthlyAmount } : row)),
                  }))
                }
              />
            </FormGrid>
            <div className="form-grid cols-2" style={{ marginTop: 8 }}>
              <CheckField
                label="Verified"
                checked={item.verified}
                onChange={(verified) =>
                  updateDeal((c) => ({
                    ...c,
                    otherIncome: c.otherIncome.map((row) => (row.id === item.id ? { ...row, verified } : row)),
                  }))
                }
              />
              <CheckField
                label="Include in base case"
                checked={item.includeInBaseCase}
                hint="Ignored unless also verified."
                onChange={(includeInBaseCase) =>
                  updateDeal((c) => ({
                    ...c,
                    otherIncome: c.otherIncome.map((row) => (row.id === item.id ? { ...row, includeInBaseCase } : row)),
                  }))
                }
              />
            </div>
          </article>
        ))}
        <ExplainBlock
          title="GRI — Gross Rental Income"
          meaning="Scheduled legal rent for the year, before vacancy and before the mortgage."
          formula="Verified monthly rents × 12"
          why="Everything else in the analysis starts here. If GRI includes illegal space, every return looks better than it is."
        >
          <p>For this property, GRI is {money(analysis.gri)}.</p>
        </ExplainBlock>
      </Panel>
    </div>
  );
}
