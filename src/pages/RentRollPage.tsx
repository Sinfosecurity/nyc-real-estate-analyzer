import { CheckField, NumberField, SelectField, TextField } from '../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../components/ui';
import { createUnit } from '../constants/defaults';
import { useDeal } from '../hooks/useDeal';
import type { IncomeStatus, OccupancyStatus, RentRegulationStatus, RentScenario, SpaceType, Unit } from '../models';
import { money } from '../utils/format';

export function RentRollPage() {
  const { deal, analysis, updateDeal } = useDeal();

  const updateUnit = (id: string, partial: Partial<Unit>) =>
    updateDeal((current) => ({
      ...current,
      units: current.units.map((unit) => (unit.id === id ? { ...unit, ...partial } : unit)),
    }));

  const addUnit = () =>
    updateDeal((current) => ({
      ...current,
      units: [
        ...current.units,
        createUnit({ identifier: String(current.units.length + 1) }),
      ],
    }));

  const removeUnit = (id: string) =>
    updateDeal((current) => ({ ...current, units: current.units.filter((unit) => unit.id !== id) }));

  const duplicateUnit = (id: string) =>
    updateDeal((current) => {
      const source = current.units.find((unit) => unit.id === id);
      if (!source) return current;
      return {
        ...current,
        units: [...current.units, createUnit({ ...source, identifier: `${source.identifier} copy` })],
      };
    });

  return (
    <div className="stack">
      <PageHeader eyebrow="Legal rent roll" title="Rent roll">
        <p className="muted">
          Only units marked “Legal occupancy verified” enter base-case GRI. Current, market, and
          underwritten rents are stored separately.
        </p>
      </PageHeader>
      <Banner>
        Potential income is excluded from base-case underwriting until legal occupancy and permitted
        use are verified. Advertised market rent is not automatically legally collectible.
      </Banner>
      {deal.units.some((u) => (u.rentRegulationStatus ?? (u.rentStabilized ? 'stabilized' : 'unknown')) === 'unknown') ? (
        <Banner tone="info">
          One or more units have unknown rent-regulation status. Do not assume market rent is
          collectible until you verify DHCR / rent-regulation records.
        </Banner>
      ) : null}
      <Panel
        title="Rent scenario"
        actions={
          <button type="button" onClick={addUnit}>
            Add unit
          </button>
        }
      >
        <SelectField
          label="Analyze using"
          value={deal.assumptions.rentScenario}
          onChange={(rentScenario) =>
            updateDeal((current) => ({
              ...current,
              assumptions: { ...current.assumptions, rentScenario: rentScenario as RentScenario },
            }))
          }
          options={[
            { value: 'current', label: 'CURRENT in-place rent' },
            { value: 'market', label: 'MARKET rent' },
            { value: 'underwritten', label: 'CUSTOM UNDERWRITTEN rent' },
          ]}
        />
        <table style={{ marginTop: 12 }}>
          <tbody>
            <tr>
              <td>Current legal rent (annual)</td>
              <td className="num">{money(analysis.currentRentAnnual)}</td>
            </tr>
            <tr>
              <td>Market legal rent (annual)</td>
              <td className="num">{money(analysis.marketRentAnnual)}</td>
            </tr>
            <tr>
              <td>Underwritten legal rent (annual)</td>
              <td className="num">{money(analysis.underwrittenRentAnnual)}</td>
            </tr>
            <tr>
              <td>GRI used in this analysis</td>
              <td className="num">{money(analysis.gri)}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
      {deal.units.map((unit) => (
        <article className="unit-card" key={unit.id}>
          <div className="card-toolbar">
            <h3>Unit {unit.identifier || '—'}</h3>
            <div className="btn-row">
              <button type="button" className="secondary" onClick={() => duplicateUnit(unit.id)}>
                Duplicate
              </button>
              <button type="button" className="danger" onClick={() => removeUnit(unit.id)}>
                Remove
              </button>
            </div>
          </div>
          {!unit.legalOccupancyVerified ? (
            <Banner tone="danger">
              This unit is excluded from base-case income because legal occupancy is not verified.
            </Banner>
          ) : null}
          <FormGrid cols={3}>
            <TextField label="Unit identifier" value={unit.identifier} onChange={(identifier) => updateUnit(unit.id, { identifier })} />
            <NumberField label="Bedrooms" value={unit.bedrooms} step={0.5} onChange={(bedrooms) => updateUnit(unit.id, { bedrooms })} />
            <NumberField label="Bathrooms" value={unit.bathrooms} step={0.5} onChange={(bathrooms) => updateUnit(unit.id, { bathrooms })} />
            <NumberField label="Current monthly rent ($)" value={unit.currentMonthlyRent} onChange={(currentMonthlyRent) => updateUnit(unit.id, { currentMonthlyRent })} />
            <NumberField label="Market monthly rent ($)" value={unit.marketMonthlyRent} onChange={(marketMonthlyRent) => updateUnit(unit.id, { marketMonthlyRent })} />
            <NumberField label="Underwritten monthly rent ($)" value={unit.underwrittenMonthlyRent} onChange={(underwrittenMonthlyRent) => updateUnit(unit.id, { underwrittenMonthlyRent })} />
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
            <TextField label="Lease expiration" value={unit.leaseExpiration} onChange={(leaseExpiration) => updateUnit(unit.id, { leaseExpiration })} placeholder="YYYY-MM-DD" />
            <TextField label="Notes" value={unit.notes} onChange={(notes) => updateUnit(unit.id, { notes })} />
          </FormGrid>
          <div className="form-grid cols-2" style={{ marginTop: 12 }}>
            <SelectField
              label="Income status"
              value={unit.incomeStatus ?? (unit.legalOccupancyVerified ? 'verified' : 'unverified')}
              onChange={(incomeStatus) =>
                updateUnit(unit.id, {
                  incomeStatus: incomeStatus as IncomeStatus,
                  legalOccupancyVerified: incomeStatus === 'verified' || incomeStatus === 'user_attested',
                })
              }
              options={[
                { value: 'verified', label: 'Verified' },
                { value: 'user_attested', label: 'User-attested' },
                { value: 'unverified', label: 'Unverified' },
                { value: 'potentially_non_conforming', label: 'Potentially non-conforming' },
                { value: 'excluded', label: 'Excluded' },
              ]}
            />
            <SelectField
              label="Space type"
              value={unit.spaceType ?? 'primary'}
              onChange={(spaceType) => updateUnit(unit.id, { spaceType: spaceType as SpaceType })}
              options={[
                { value: 'primary', label: 'Primary / legal dwelling' },
                { value: 'basement', label: 'Basement' },
                { value: 'cellar', label: 'Cellar' },
                { value: 'attic', label: 'Attic' },
                { value: 'garage', label: 'Garage' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <SelectField
              label="Rent regulation"
              value={unit.rentRegulationStatus ?? (unit.rentStabilized ? 'stabilized' : 'unknown')}
              onChange={(rentRegulationStatus) =>
                updateUnit(unit.id, {
                  rentRegulationStatus: rentRegulationStatus as RentRegulationStatus,
                  rentStabilized: rentRegulationStatus === 'stabilized' || rentRegulationStatus === 'controlled',
                })
              }
              options={[
                { value: 'unknown', label: 'Unknown — do not assume market' },
                { value: 'market', label: 'Market rate (user-attested)' },
                { value: 'stabilized', label: 'Rent stabilized' },
                { value: 'controlled', label: 'Rent controlled' },
              ]}
            />
            <CheckField label="Legal occupancy verified" checked={unit.legalOccupancyVerified} onChange={(legalOccupancyVerified) => updateUnit(unit.id, { legalOccupancyVerified })} />
            <CheckField label="Tenant pays electric" checked={unit.tenantPaysElectric} onChange={(tenantPaysElectric) => updateUnit(unit.id, { tenantPaysElectric })} />
            <CheckField label="Tenant pays gas" checked={unit.tenantPaysGas} onChange={(tenantPaysGas) => updateUnit(unit.id, { tenantPaysGas })} />
          </div>
        </article>
      ))}
    </div>
  );
}
