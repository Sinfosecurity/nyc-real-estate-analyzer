import { useState } from 'react';
import { Importance, SourceBadge } from '../../components/guided/chrome';
import { NumberField, SelectField, TextField } from '../../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../../components/ui';
import { useDeal } from '../../hooks/useDeal';
import type { Borough } from '../../models';
import { lookupProperty } from '../../services/nyc/propertyLookup';
import { money } from '../../utils/format';

const TYPES = [
  '1-family',
  '2-family',
  '3-family',
  '4-family',
  'Small multifamily (5–12)',
  'Multifamily (13+)',
  'Mixed-use',
  'Other',
];

export function StepProperty() {
  const { deal, updateDeal } = useDeal();
  const p = deal.property;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [techOpen, setTechOpen] = useState(false);
  const [found, setFound] = useState(Boolean(p.lastLookupAt));

  const patch = (partial: Partial<typeof p>) =>
    updateDeal((c) => ({ ...c, property: { ...c.property, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 1 of 8" title="What property are you analyzing?">
        <p className="muted">Start with the address. Technical tax-lot details stay tucked away unless we find them.</p>
      </PageHeader>
      <Panel>
        <FormGrid>
          <div>
            <Importance kind="required" />
            <TextField
              label="Property address"
              value={p.address}
              onChange={(address) => patch({ address })}
              placeholder="179-28 142nd Avenue, Queens, NY 11434"
            />
          </div>
          <div>
            <Importance kind="optional" />
            <TextField label="Listing URL" value={p.listingUrl ?? ''} onChange={(listingUrl) => patch({ listingUrl })} />
          </div>
          <div>
            <Importance kind="required" />
            <NumberField
              label="Asking price ($)"
              value={deal.loan.purchasePrice}
              onChange={(purchasePrice) =>
                updateDeal((c) => ({
                  ...c,
                  loan: { ...c.loan, purchasePrice },
                  offerPrices: {
                    asking: purchasePrice,
                    target: c.offerPrices?.target ?? 0,
                    aggressive: c.offerPrices?.aggressive ?? 0,
                    custom: c.offerPrices?.custom ?? purchasePrice,
                  },
                  property: { ...c.property, listingPrice: purchasePrice },
                }))
              }
            />
          </div>
          <div>
            <Importance kind="recommended" />
            <SelectField
              label="Property type"
              value={p.propertyType}
              onChange={(propertyType) => patch({ propertyType })}
              options={TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </FormGrid>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-xl"
            disabled={busy || p.address.length < 5}
            onClick={async () => {
              setBusy(true);
              setError('');
              setStatus([]);
              try {
                const result = await lookupProperty([p.address, p.borough, p.zip].filter(Boolean).join(', '));
                const hit = result.geocode;
                const pluto = result.pluto;
                const notes: string[] = [];
                if (hit) notes.push('Property located in NYC records');
                if (hit?.padBbl) notes.push('BBL identified');
                if (pluto) notes.push('PLUTO property information retrieved');
                notes.push('Legal occupancy still requires verification');
                patch({
                  address: hit?.name || p.address,
                  borough: (hit?.borough as Borough) || p.borough,
                  neighborhood: hit?.neighbourhood || p.neighborhood,
                  zip: hit?.postalcode || p.zip,
                  bbl: hit?.padBbl || p.bbl,
                  block: pluto?.block || (hit?.padBbl ? String(Number(hit.padBbl.slice(1, 6))) : p.block),
                  lot: pluto?.lot || (hit?.padBbl ? String(Number(hit.padBbl.slice(6))) : p.lot),
                  officialZoning: pluto?.zonedist1,
                  zoning: pluto?.zonedist1 || p.zoning,
                  yearBuilt: pluto?.yearbuilt ? Number(pluto.yearbuilt) : p.yearBuilt,
                  squareFootage: pluto?.bldgarea ? Number(pluto.bldgarea) : p.squareFootage,
                  lotSize: pluto?.lotarea ? Number(pluto.lotarea) : p.lotSize,
                  officialUnitCount: pluto?.unitsres ? Number(pluto.unitsres) : p.officialUnitCount,
                  lastLookupAt: result.retrievedAt,
                  lastLookupSource: 'NYC GeoSearch + PLUTO',
                  legalOccupancyFinding: result.finding,
                });
                setStatus(notes);
                setFound(Boolean(hit));
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Lookup failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Looking up…' : 'Look Up Property'}
          </button>
        </div>
        {error ? (
          <Banner tone="danger">
            NYC property records could not be retrieved right now.
            <div className="btn-row" style={{ marginTop: 8 }}>
              <button type="button" className="secondary" onClick={() => setError('')}>
                Enter Manually
              </button>
            </div>
            <details>
              <summary>Technical details</summary>
              <p className="small">{error}</p>
            </details>
          </Banner>
        ) : null}
        {status.length > 0 ? (
          <ul className="lookup-log">
            {status.map((line) => (
              <li key={line}>{line.startsWith('Legal') ? `⚠ ${line}` : `✓ ${line}`}</li>
            ))}
          </ul>
        ) : null}
      </Panel>

      {found || p.lastLookupAt ? (
        <Panel title="We found this property">
          <table>
            <tbody>
              <tr>
                <td>Address</td>
                <td>{p.address}</td>
                <td><SourceBadge kind="official_source" /></td>
              </tr>
              <tr>
                <td>Borough / neighborhood / ZIP</td>
                <td>{[p.borough, p.neighborhood, p.zip].filter(Boolean).join(' · ') || '—'}</td>
                <td><SourceBadge kind="official_source" /></td>
              </tr>
              <tr>
                <td>Year built</td>
                <td>{p.yearBuilt ?? '—'}</td>
                <td><SourceBadge kind={p.yearBuilt ? 'official_source' : 'unverified'} /></td>
              </tr>
              <tr>
                <td>Building / lot size</td>
                <td>
                  {p.squareFootage ? `${p.squareFootage.toLocaleString()} sf` : '—'} /{' '}
                  {p.lotSize ? `${p.lotSize.toLocaleString()} sf` : '—'}
                </td>
                <td><SourceBadge kind={p.squareFootage ? 'official_source' : 'unverified'} /></td>
              </tr>
              <tr>
                <td>Zoning</td>
                <td>{p.zoning || '—'}</td>
                <td><SourceBadge kind={p.zoning ? 'official_source' : 'unverified'} /></td>
              </tr>
              <tr>
                <td>Official unit count</td>
                <td>{p.officialUnitCount ?? 'Not in this lookup'}</td>
                <td><SourceBadge kind={p.officialUnitCount != null ? 'official_source' : 'unverified'} /></td>
              </tr>
              <tr>
                <td>Asking price</td>
                <td>{money(deal.loan.purchasePrice)}</td>
                <td><SourceBadge kind="user_entered" /></td>
              </tr>
            </tbody>
          </table>
          <button type="button" className="text-btn" onClick={() => setTechOpen((v) => !v)}>
            {techOpen ? 'Hide property-record details' : 'View property-record details'}
          </button>
          {techOpen ? (
            <p className="small muted">
              BBL {p.bbl || '—'} · Block {p.block || '—'} · Lot {p.lot || '—'} · Retrieved{' '}
              {p.lastLookupAt || 'n/a'} from {p.lastLookupSource || 'user'}. A lookup never concludes that a
              unit is legal.
            </p>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
