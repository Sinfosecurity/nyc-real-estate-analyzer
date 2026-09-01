import type { Borough, PropertyInfo } from '../../models';
import { searchAddress, type GeoSearchHit } from './geosearch';
import { inferPropertyTypeFromPluto } from './propertyType';
import { formatBbl, NYC_DATASETS, sodaQuery } from './soda';

export interface PlutoRecord {
  bbl?: string;
  address?: string;
  borough?: string;
  block?: string;
  lot?: string;
  zonedist1?: string;
  yearbuilt?: string;
  bldgarea?: string;
  lotarea?: string;
  unitstotal?: string;
  unitsres?: string;
  zipcode?: string;
  ownername?: string;
  bldgclass?: string;
  landuse?: string;
  assessland?: string;
  assesstot?: string;
}

export interface ViolationCount {
  dataset: string;
  label: string;
  count: number;
  sourceUrl: string;
  retrievedAt: string;
}

export interface PropertyLookupResult {
  query: string;
  retrievedAt: string;
  geocode: GeoSearchHit | null;
  candidates: GeoSearchHit[];
  pluto: PlutoRecord | null;
  violations: ViolationCount[];
  finding:
    | 'records_require_review'
    | 'potential_conflict'
    | 'not_verified';
  notes: string[];
}

function sourceUrl(dataset: string, query: string): string {
  return `https://data.cityofnewyork.us/resource/${dataset}.json?${query}`;
}

export async function lookupProperty(address: string): Promise<PropertyLookupResult> {
  const retrievedAt = new Date().toISOString();
  const notes: string[] = [
    'Public records do not by themselves establish that a unit is legal to occupy or rent.',
    'This lookup never concludes “this unit is legal.”',
  ];
  const candidates = await searchAddress(address, 5);
  const geocode = candidates[0] ?? null;
  let pluto: PlutoRecord | null = null;
  const violations: ViolationCount[] = [];

  const bbl = geocode?.padBbl;
  if (bbl) {
    const rows = await sodaQuery<PlutoRecord>(NYC_DATASETS.pluto, {
      bbl,
      $limit: '1',
    });
    pluto = rows[0] ?? null;
    if (!pluto) notes.push('BBL was geocoded but no PLUTO row was returned.');

    const [dob, ecb, hpd] = await Promise.allSettled([
      sodaQuery<Record<string, string>>(NYC_DATASETS.dobViolations, {
        $where: `bin='${geocode?.padBin ?? ''}'`,
        $limit: '1',
        $select: 'bin',
      }),
      sodaQuery<Record<string, string>>(NYC_DATASETS.ecbViolations, {
        $where: `bbl='${bbl}'`,
        $limit: '1',
        $select: 'bbl',
      }),
      sodaQuery<Record<string, string>>(NYC_DATASETS.hpdViolations, {
        $where: hpdWhereFromBbl(bbl),
        $limit: '1',
        $select: 'violationid',
      }),
    ]);

    violations.push(
      settledCount('DOB violations', NYC_DATASETS.dobViolations, dob, retrievedAt),
      settledCount('ECB/OATH violations', NYC_DATASETS.ecbViolations, ecb, retrievedAt),
      settledCount('HPD violations (sample)', NYC_DATASETS.hpdViolations, hpd, retrievedAt),
    );
  } else {
    notes.push('GeoSearch did not return a PAD BBL. Tax-lot records were not queried.');
  }

  return {
    query: address,
    retrievedAt,
    geocode,
    candidates,
    pluto,
    violations,
    finding: 'records_require_review',
    notes,
  };
}

export function propertyFieldsFromLookup(
  result: PropertyLookupResult,
  current: PropertyInfo,
): Partial<PropertyInfo> {
  const hit = result.geocode;
  const pluto = result.pluto;
  const inferredType = inferPropertyTypeFromPluto(pluto);
  return {
    address: hit?.name || current.address,
    borough: (hit?.borough as Borough) || current.borough,
    neighborhood: hit?.neighbourhood || current.neighborhood,
    zip: hit?.postalcode || current.zip,
    bbl: hit?.padBbl || current.bbl,
    block: pluto?.block || (hit?.padBbl ? String(Number(hit.padBbl.slice(1, 6))) : current.block),
    lot: pluto?.lot || (hit?.padBbl ? String(Number(hit.padBbl.slice(6))) : current.lot),
    officialZoning: pluto?.zonedist1,
    zoning: pluto?.zonedist1 || current.zoning,
    yearBuilt: pluto?.yearbuilt ? Number(pluto.yearbuilt) : current.yearBuilt,
    squareFootage: pluto?.bldgarea ? Number(pluto.bldgarea) : current.squareFootage,
    lotSize: pluto?.lotarea ? Number(pluto.lotarea) : current.lotSize,
    officialUnitCount: pluto?.unitsres ? Number(pluto.unitsres) : current.officialUnitCount,
    legalUnitCount:
      current.legalUnitCount > 0
        ? current.legalUnitCount
        : pluto?.unitsres
          ? Number(pluto.unitsres)
          : current.legalUnitCount,
    observedUnitCount:
      current.observedUnitCount && current.observedUnitCount > 0
        ? current.observedUnitCount
        : pluto?.unitsres
          ? Number(pluto.unitsres)
          : current.observedUnitCount,
    propertyType: inferredType ?? current.propertyType,
    lastLookupAt: result.retrievedAt,
    lastLookupSource: 'NYC GeoSearch + PLUTO',
    legalOccupancyFinding: result.finding,
  };
}

export function lookupByBlockLot(borough: string, block: string, lot: string): string | null {
  return formatBbl(borough, block, lot);
}

function hpdWhereFromBbl(bbl: string): string {
  const boroid = bbl.slice(0, 1);
  const block = String(Number(bbl.slice(1, 6)));
  const lot = String(Number(bbl.slice(6)));
  return `boroid='${boroid}' AND block='${block}' AND lot='${lot}'`;
}

function settledCount(
  label: string,
  dataset: string,
  result: PromiseSettledResult<Record<string, string>[]>,
  retrievedAt: string,
): ViolationCount {
  if (result.status === 'fulfilled') {
    return {
      dataset,
      label,
      count: result.value.length,
      sourceUrl: sourceUrl(dataset, ''),
      retrievedAt,
    };
  }
  return {
    dataset,
    label: `${label} (unavailable)`,
    count: 0,
    sourceUrl: sourceUrl(dataset, ''),
    retrievedAt,
  };
}
