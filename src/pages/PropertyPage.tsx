import { useState } from 'react';
import { CheckField, NumberField, SelectField, TextAreaField, TextField } from '../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { Borough, PropertyTaxModel, TaxSourceUsed } from '../models';
import { lookupProperty, propertyFieldsFromLookup } from '../services/nyc/propertyLookup';
import { inferPropertyTypeFromPluto, PROPERTY_TYPE_OPTIONS } from '../services/nyc/propertyType';

const BOROUGHS: Borough[] = ['', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export function PropertyPage() {
  const { deal, updateDeal } = useDeal();
  const p = deal.property;
  const [lookupStatus, setLookupStatus] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);

  const patch = (partial: Partial<typeof p>) =>
    updateDeal((current) => ({ ...current, property: { ...current.property, ...partial } }));

  const resolvedTaxAmount = (tax: PropertyTaxModel): number => {
    if (tax.sourceUsed === 'current') return tax.currentAnnual;
    if (tax.sourceUsed === 'listing') return tax.listingReported ?? tax.userUnderwritten;
    if (tax.sourceUsed === 'official') return tax.officialRecord ?? tax.userUnderwritten;
    return tax.userUnderwritten;
  };

  const patchTax = (partial: Partial<PropertyTaxModel>) =>
    updateDeal((current) => {
      const tax: PropertyTaxModel = {
        currentAnnual: 8000,
        listingReported: null,
        officialRecord: null,
        userUnderwritten: 8000,
        sourceUsed: 'underwritten',
        marketValue: null,
        assessedValue: null,
        taxableValue: null,
        ...current.property.tax,
        ...partial,
      };
      const annual = resolvedTaxAmount(tax);
      return {
        ...current,
        property: { ...current.property, tax },
        expenses: current.expenses.map((item) =>
          item.key === 'taxes' ? { ...item, annualAmount: annual, mode: 'dollar' } : item,
        ),
      };
    });

  return (
    <div className="stack">
      <PageHeader eyebrow="NYC property information" title="Property">
        <p className="muted">
          These fields identify the asset. They do not verify government records.
        </p>
      </PageHeader>
      <Banner tone="info">
        Look Up Property uses NYC Planning GeoSearch and NYC Open Data (PLUTO / violation datasets).
        A successful lookup is <strong>OFFICIAL SOURCE</strong> for the returned fields only. It never
        concludes that a unit is legal.
      </Banner>
      <Panel title="Look up property">
        <div className="btn-row">
          <button
            type="button"
            disabled={lookupBusy || p.address.length < 5}
            onClick={async () => {
              setLookupBusy(true);
              setLookupStatus('');
              try {
                const result = await lookupProperty([p.address, p.borough, p.zip].filter(Boolean).join(', '));
                const inferredType = inferPropertyTypeFromPluto(result.pluto);
                patch(propertyFieldsFromLookup(result, p));
                setLookupStatus(
                  `${result.finding.replaceAll('_', ' ')}. ${
                    inferredType ? `Property type set to ${inferredType}. ` : ''
                  }${result.notes[0] ?? ''} Retrieved ${result.retrievedAt}.`,
                );
              } catch (error) {
                setLookupStatus(error instanceof Error ? error.message : 'Lookup failed.');
              } finally {
                setLookupBusy(false);
              }
            }}
          >
            {lookupBusy ? 'Looking up…' : 'Look up property'}
          </button>
        </div>
        {lookupStatus ? <p className="muted">{lookupStatus}</p> : null}
        <p className="small muted">
          Finding language: LEGAL OCCUPANCY VERIFIED · NOT VERIFIED · RECORDS REQUIRE REVIEW ·
          POTENTIAL CONFLICT. This app will not emit “this unit is legal.”
        </p>
      </Panel>
      <Panel title="Identity">
        <FormGrid>
          <TextField label="Deal name" value={deal.name} onChange={(name) => updateDeal((d) => ({ ...d, name }))} />
          <TextField label="Street address" value={p.address} onChange={(address) => patch({ address })} />
          <SelectField
            label="Borough"
            value={p.borough}
            onChange={(borough) => patch({ borough: borough as Borough })}
            options={BOROUGHS.map((b) => ({ value: b, label: b || 'Select' }))}
          />
          <TextField label="Neighborhood" value={p.neighborhood} onChange={(neighborhood) => patch({ neighborhood })} />
          <TextField label="ZIP" value={p.zip} onChange={(zip) => patch({ zip })} />
          <SelectField
            label="Property type"
            value={p.propertyType}
            onChange={(propertyType) => patch({ propertyType })}
            options={PROPERTY_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
        </FormGrid>
      </Panel>
      <Panel title="Tax lot and building">
        <FormGrid>
          <TextField label="BBL" value={p.bbl ?? ''} onChange={(bbl) => patch({ bbl })} hint="Official tax lot if retrieved." />
          <TextField label="Block" value={p.block} onChange={(block) => patch({ block })} />
          <TextField label="Lot" value={p.lot} onChange={(lot) => patch({ lot })} />
          <NumberField label="Legal unit count (user underwriting)" value={p.legalUnitCount} onChange={(legalUnitCount) => patch({ legalUnitCount })} step={1} />
          <NumberField
            label="Observed / listing unit count"
            value={p.observedUnitCount ?? 0}
            onChange={(observedUnitCount) => patch({ observedUnitCount })}
          />
          <NumberField
            label="Official-record unit count (if retrieved)"
            value={p.officialUnitCount ?? 0}
            onChange={(officialUnitCount) => patch({ officialUnitCount: officialUnitCount || null })}
          />
          <NumberField
            label="Year built"
            value={p.yearBuilt ?? 0}
            onChange={(yearBuilt) => patch({ yearBuilt: yearBuilt || null })}
            step={1}
          />
          <NumberField label="Gross square footage" value={p.squareFootage} onChange={(squareFootage) => patch({ squareFootage })} />
          <NumberField label="Lot size (sq ft)" value={p.lotSize} onChange={(lotSize) => patch({ lotSize })} />
          <TextField label="Zoning" value={p.zoning} onChange={(zoning) => patch({ zoning })} />
        </FormGrid>
      </Panel>
      <Panel title="Record status (user-entered)">
        <FormGrid>
          <TextField
            label="Certificate of Occupancy status"
            value={p.certificateOfOccupancyStatus}
            onChange={(certificateOfOccupancyStatus) => patch({ certificateOfOccupancyStatus })}
          />
          <TextField label="DOB status" value={p.dobStatus} onChange={(dobStatus) => patch({ dobStatus })} />
          <TextField label="HPD status" value={p.hpdStatus} onChange={(hpdStatus) => patch({ hpdStatus })} />
          <TextField label="Tax class" value={p.taxClass ?? ''} onChange={(taxClass) => patch({ taxClass })} />
          <TextField label="Listing URL" value={p.listingUrl ?? ''} onChange={(listingUrl) => patch({ listingUrl })} />
          <NumberField label="Listing price ($)" value={p.listingPrice ?? 0} onChange={(listingPrice) => patch({ listingPrice })} />
          <TextField label="Listing source" value={p.listingSource ?? ''} onChange={(listingSource) => patch({ listingSource })} />
          <TextField label="Listing notes" value={p.listingNotes ?? ''} onChange={(listingNotes) => patch({ listingNotes })} />
        </FormGrid>
        <div style={{ marginTop: 12 }}>
          <TextAreaField label="Property notes" value={p.notes} onChange={(notes) => patch({ notes })} />
        </div>
      </Panel>
      <Panel title="Property tax model" intro="Market value, assessed value, taxable value, and the actual tax bill are different numbers. Choose which annual tax the underwriting uses.">
        <FormGrid>
          <NumberField
            label="Current annual tax (user-entered)"
            value={p.tax?.currentAnnual ?? 8000}
            onChange={(currentAnnual) => patchTax({ currentAnnual })}
          />
          <NumberField
            label="Listing-reported tax"
            value={p.tax?.listingReported ?? 0}
            onChange={(listingReported) => patchTax({ listingReported: listingReported || null })}
          />
          <NumberField
            label="Official-record tax"
            value={p.tax?.officialRecord ?? 0}
            onChange={(officialRecord) => patchTax({ officialRecord: officialRecord || null })}
          />
          <NumberField
            label="User-underwritten tax"
            value={p.tax?.userUnderwritten ?? 8000}
            onChange={(userUnderwritten) => patchTax({ userUnderwritten })}
          />
          <SelectField
            label="Amount used for underwriting"
            value={p.tax?.sourceUsed ?? 'underwritten'}
            onChange={(sourceUsed) => patchTax({ sourceUsed: sourceUsed as TaxSourceUsed })}
            options={[
              { value: 'underwritten', label: 'User-underwritten' },
              { value: 'current', label: 'Current annual (user-entered)' },
              { value: 'listing', label: 'Listing-reported' },
              { value: 'official', label: 'Official-record' },
            ]}
          />
          <NumberField
            label="Market value (not the tax bill)"
            value={p.tax?.marketValue ?? 0}
            onChange={(marketValue) => patchTax({ marketValue: marketValue || null })}
          />
          <NumberField
            label="Assessed value"
            value={p.tax?.assessedValue ?? 0}
            onChange={(assessedValue) => patchTax({ assessedValue: assessedValue || null })}
          />
          <NumberField
            label="Taxable value"
            value={p.tax?.taxableValue ?? 0}
            onChange={(taxableValue) => patchTax({ taxableValue: taxableValue || null })}
          />
        </FormGrid>
        <p className="small muted">
          Changing the selected source updates the Property taxes OpEx line. Official DOF bills are
          not retrieved automatically (PREPARED / BLOCKED).
        </p>
      </Panel>
      <Panel title="Purchase price">
        <FormGrid>
          <NumberField
            label="Purchase / asking price ($)"
            value={deal.loan.purchasePrice}
            onChange={(purchasePrice) =>
              updateDeal((current) => ({ ...current, loan: { ...current.loan, purchasePrice } }))
            }
          />
        </FormGrid>
        <CheckField
          label="Appreciation scenario enabled"
          checked={deal.assumptions.appreciationRate > 0}
          onChange={(on) =>
            updateDeal((current) => ({
              ...current,
              assumptions: { ...current.assumptions, appreciationRate: on ? current.assumptions.appreciationRate || 2 : 0 },
            }))
          }
          hint="Off by default. Never implied."
        />
        {deal.assumptions.appreciationRate > 0 ? (
          <NumberField
            label="Explicit annual appreciation assumption (%)"
            value={deal.assumptions.appreciationRate}
            step={0.1}
            onChange={(appreciationRate) =>
              updateDeal((current) => ({
                ...current,
                assumptions: { ...current.assumptions, appreciationRate },
              }))
            }
          />
        ) : null}
      </Panel>
    </div>
  );
}
