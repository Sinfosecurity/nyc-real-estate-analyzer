const SODA_BASE = 'https://data.cityofnewyork.us/resource';

export const NYC_DATASETS = {
  pluto: '64uk-42ks',
  dobViolations: '3h2n-5cm9',
  ecbViolations: '6bgk-3dad',
  hpdViolations: 'wvxf-dwi5',
} as const;

export class NycDataError extends Error {
  dataset: string;
  override cause?: unknown;
  constructor(message: string, dataset: string, cause?: unknown) {
    super(message);
    this.name = 'NycDataError';
    this.dataset = dataset;
    this.cause = cause;
  }
}

export async function sodaQuery<T>(
  dataset: string,
  params: Record<string, string>,
): Promise<T[]> {
  const url = new URL(`${SODA_BASE}/${dataset}.json`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new NycDataError(
        `NYC Open Data ${dataset} returned HTTP ${response.status}. Official records were not retrieved.`,
        dataset,
      );
    }
    const json: unknown = await response.json();
    if (!Array.isArray(json)) {
      throw new NycDataError(`Unexpected payload from ${dataset}.`, dataset);
    }
    return json as T[];
  } catch (error) {
    if (error instanceof NycDataError) throw error;
    throw new NycDataError(
      `Could not reach NYC Open Data (${dataset}). Check the network; no records were invented.`,
      dataset,
      error,
    );
  }
}

export function boroughCode(borough: string): string | null {
  const map: Record<string, string> = {
    manhattan: '1',
    bronx: '2',
    brooklyn: '3',
    queens: '4',
    'staten island': '5',
  };
  return map[borough.trim().toLowerCase()] ?? null;
}

export function formatBbl(borough: string, block: string, lot: string): string | null {
  const boro = boroughCode(borough);
  const blk = block.replace(/\D/g, '').padStart(5, '0');
  const lt = lot.replace(/\D/g, '').padStart(4, '0');
  if (!boro || blk.length > 5 || lt.length > 4 || !block || !lot) return null;
  return `${boro}${blk}${lt}`;
}
