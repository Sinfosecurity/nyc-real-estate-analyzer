export interface PlutoTypeFields {
  bldgclass?: string;
  landuse?: string;
  unitsres?: string;
  unitstotal?: string;
}

export const PROPERTY_TYPE_OPTIONS = [
  '1-family',
  '2-family',
  '3-family',
  '4-family',
  'Small multifamily (5–12)',
  'Multifamily (13+)',
  'Mixed-use',
  'Other',
] as const;

export type PropertyTypeOption = (typeof PROPERTY_TYPE_OPTIONS)[number];

function residentialUnits(pluto: PlutoTypeFields): number | null {
  const raw = pluto.unitsres ?? pluto.unitstotal;
  if (raw == null || String(raw).trim() === '') return null;
  const count = Number(raw);
  return Number.isFinite(count) ? count : null;
}

function typeFromUnitCount(units: number): PropertyTypeOption {
  if (units <= 1) return '1-family';
  if (units === 2) return '2-family';
  if (units === 3) return '3-family';
  if (units === 4) return '4-family';
  if (units <= 12) return 'Small multifamily (5–12)';
  return 'Multifamily (13+)';
}

/**
 * Maps PLUTO building class / land use / residential units to the app's
 * property-type list. Returns undefined when records are not specific enough
 * so a user-entered value is left alone.
 */
export function inferPropertyTypeFromPluto(
  pluto: PlutoTypeFields | null | undefined,
): PropertyTypeOption | undefined {
  if (!pluto) return undefined;

  const buildingClass = (pluto.bldgclass ?? '').trim().toUpperCase();
  const landUse = String(pluto.landuse ?? '').trim();
  const units = residentialUnits(pluto);
  const letter = buildingClass.charAt(0);

  if (letter === 'S' || buildingClass === 'C7') return 'Mixed-use';
  if (landUse === '4' || landUse === '04') return 'Mixed-use';
  if (letter === 'A' || buildingClass === 'R1') return '1-family';
  if (letter === 'B' || buildingClass === 'R2') return '2-family';
  if (buildingClass === 'C0' || buildingClass === 'R3') return '3-family';
  if (buildingClass === 'C3') return '4-family';
  if (units != null && units > 0) return typeFromUnitCount(units);
  if (letter && !'ABCDR'.includes(letter)) return 'Other';
  return undefined;
}
