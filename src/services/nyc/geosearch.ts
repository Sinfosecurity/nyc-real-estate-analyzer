/**
 * NYC Planning GeoSearch — official PAD-based geocoder.
 * Docs: https://geosearch.planninglabs.nyc/docs/
 * No API key required. Does not establish legal occupancy.
 */

export interface GeoSearchHit {
  label: string;
  name: string;
  borough?: string;
  neighbourhood?: string;
  postalcode?: string;
  housenumber?: string;
  street?: string;
  padBbl?: string;
  padBin?: string;
  longitude?: number;
  latitude?: number;
}

interface GeoSearchFeature {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, unknown>;
}

interface GeoSearchResponse {
  features?: GeoSearchFeature[];
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

export async function searchAddress(text: string, size = 5): Promise<GeoSearchHit[]> {
  const query = text.trim();
  if (query.length < 3) return [];
  const url = new URL('https://geosearch.planninglabs.nyc/v2/search');
  url.searchParams.set('text', query);
  url.searchParams.set('size', String(size));
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`NYC GeoSearch returned HTTP ${response.status}. Address was not resolved.`);
  }
  const payload = (await response.json()) as GeoSearchResponse;
  return (payload.features ?? []).map((feature) => {
    const properties = feature.properties ?? {};
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    return {
      label: readString(properties, 'label') ?? readString(properties, 'name') ?? query,
      name: readString(properties, 'name') ?? '',
      borough: readString(properties, 'borough', 'borough_city'),
      neighbourhood: readString(properties, 'neighbourhood', 'neighborhood'),
      postalcode: readString(properties, 'postalcode'),
      housenumber: readString(properties, 'housenumber'),
      street: readString(properties, 'street'),
      padBbl: readString(properties, 'pad_bbl', 'addendum.pad.bbl') ?? readNestedBbl(properties),
      padBin: readString(properties, 'pad_bin') ?? readNestedBin(properties),
      longitude,
      latitude,
    };
  });
}

function readNestedBbl(properties: Record<string, unknown>): string | undefined {
  const addendum = properties.addendum;
  if (!addendum || typeof addendum !== 'object') return undefined;
  const pad = (addendum as { pad?: { bbl?: string } }).pad;
  return pad?.bbl;
}

function readNestedBin(properties: Record<string, unknown>): string | undefined {
  const addendum = properties.addendum;
  if (!addendum || typeof addendum !== 'object') return undefined;
  const pad = (addendum as { pad?: { bin?: string } }).pad;
  return pad?.bin;
}
