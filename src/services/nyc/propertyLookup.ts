import { formatBbl, NYC_DATASETS, sodaQuery } from './soda';
import { searchAddress, type GeoSearchHit } from './geosearch';

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
