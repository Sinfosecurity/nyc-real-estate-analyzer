import { NumberField, TextField } from '../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { CompSale } from '../models';
import { createId } from '../utils/id';
import { money } from '../utils/format';

function emptyComp(): CompSale {
  return {
    id: createId('comp'),
    address: '',
    saleDate: '',
    salePrice: 0,
    propertyType: '',
    legalUnits: 0,
    buildingSqft: 0,
    lotSqft: 0,
    distanceMiles: 0,
    condition: '',
    notes: '',
    source: 'Manual entry',
  };
}

export function CompsPage() {
  const { deal, analysis, updateDeal } = useDeal();
  const comps = deal.comps ?? [];
  const summary = analysis.compSummary;
  const range = analysis.valuationRange;

  const patch = (id: string, partial: Partial<CompSale>) =>
    updateDeal((c) => ({
      ...c,
      comps: (c.comps ?? []).map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Sales comparison" title="Comparable sales">
        <p className="muted">
          Manual comps only. No sale is fabricated. This is not an appraisal and adjustments are
          conceptual.
        </p>
      </PageHeader>
      <Banner tone="info">
        External comp providers are not connected. Architecture is ready; the current source is
        user-entered.
      </Banner>
      <Panel
        title="Entered comps"
        actions={
          <button type="button" onClick={() => updateDeal((c) => ({ ...c, comps: [...(c.comps ?? []), emptyComp()] }))}>
            Add manual comp
          </button>
        }
      >
        {comps.length === 0 ? (
          <div className="empty-guide">
            <h3>No comparable sales added yet</h3>
            <p>
              Comparable sales can help you evaluate whether the asking price is reasonable relative
              to similar properties. This app does not invent comps.
            </p>
          </div>
        ) : null}
        {comps.map((comp) => (
          <article className="income-card" key={comp.id}>
            <FormGrid>
              <TextField label="Address" value={comp.address} onChange={(address) => patch(comp.id, { address })} />
              <TextField label="Sale date" value={comp.saleDate} onChange={(saleDate) => patch(comp.id, { saleDate })} />
              <NumberField label="Sale price ($)" value={comp.salePrice} onChange={(salePrice) => patch(comp.id, { salePrice })} />
              <TextField label="Property type" value={comp.propertyType} onChange={(propertyType) => patch(comp.id, { propertyType })} />
              <NumberField label="Legal units" value={comp.legalUnits} onChange={(legalUnits) => patch(comp.id, { legalUnits })} />
              <NumberField label="Building sqft" value={comp.buildingSqft} onChange={(buildingSqft) => patch(comp.id, { buildingSqft })} />
              <NumberField label="Lot sqft" value={comp.lotSqft} onChange={(lotSqft) => patch(comp.id, { lotSqft })} />
              <NumberField label="Distance (miles)" value={comp.distanceMiles} step={0.1} onChange={(distanceMiles) => patch(comp.id, { distanceMiles })} />
              <TextField label="Condition" value={comp.condition} onChange={(condition) => patch(comp.id, { condition })} />
              <TextField label="Source" value={comp.source} onChange={(source) => patch(comp.id, { source })} />
              <TextField label="Notes" value={comp.notes} onChange={(notes) => patch(comp.id, { notes })} />
            </FormGrid>
            <p className="small muted">
              Price / sqft {comp.buildingSqft > 0 ? money(comp.salePrice / comp.buildingSqft) : 'N/A'} · Price /
              unit {comp.legalUnits > 0 ? money(comp.salePrice / comp.legalUnits) : 'N/A'}
            </p>
            <button
              type="button"
              className="danger"
              onClick={() => updateDeal((c) => ({ ...c, comps: (c.comps ?? []).filter((item) => item.id !== comp.id) }))}
            >
              Remove
            </button>
          </article>
        ))}
      </Panel>
      <Panel title="Indications (not an appraisal)">
        <table>
          <tbody>
            <tr><td>Count</td><td className="num">{summary?.count ?? 0}</td></tr>
            <tr><td>Average price</td><td className="num">{money(summary?.averagePrice)}</td></tr>
            <tr><td>Median price</td><td className="num">{money(summary?.medianPrice)}</td></tr>
            <tr><td>Average $/sqft</td><td className="num">{money(summary?.averagePsf)}</td></tr>
            <tr><td>Average $/unit</td><td className="num">{money(summary?.averagePerUnit)}</td></tr>
            <tr><td>Sales range</td><td className="num">{money(summary?.rangeLow)} – {money(summary?.rangeHigh)}</td></tr>
            <tr><td>Income approach</td><td className="num">{money(range?.incomeApproach)}</td></tr>
            <tr><td>Indicative underwriting range</td><td className="num">{money(range?.indicativeLow)} – {money(range?.indicativeHigh)}</td></tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
