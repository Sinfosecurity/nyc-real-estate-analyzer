import { describe, expect, it } from 'vitest';
import { createDefaultDeal } from '../constants/defaults';
import { propertyFieldsFromLookup } from '../services/nyc/propertyLookup';
import { inferPropertyTypeFromPluto } from '../services/nyc/propertyType';

describe('inferPropertyTypeFromPluto', () => {
  it('maps the Springfield Gardens A5 lookup to 1-family', () => {
    expect(
      inferPropertyTypeFromPluto({
        bldgclass: 'A5',
        landuse: '1',
        unitsres: '1',
        unitstotal: '1',
      }),
    ).toBe('1-family');
  });

  it('maps two-family, three-family, and four-family building classes', () => {
    expect(inferPropertyTypeFromPluto({ bldgclass: 'B1', unitsres: '2' })).toBe('2-family');
    expect(inferPropertyTypeFromPluto({ bldgclass: 'C0', unitsres: '3' })).toBe('3-family');
    expect(inferPropertyTypeFromPluto({ bldgclass: 'C3', unitsres: '4' })).toBe('4-family');
  });

  it('uses residential unit count for larger apartment classes', () => {
    expect(inferPropertyTypeFromPluto({ bldgclass: 'C1', unitsres: '8' })).toBe(
      'Small multifamily (5–12)',
    );
    expect(inferPropertyTypeFromPluto({ bldgclass: 'D1', unitsres: '40' })).toBe('Multifamily (13+)');
  });

  it('maps mixed-use residence-with-store classes', () => {
    expect(inferPropertyTypeFromPluto({ bldgclass: 'S2', unitsres: '3' })).toBe('Mixed-use');
    expect(inferPropertyTypeFromPluto({ landuse: '04', unitsres: '4' })).toBe('Mixed-use');
  });

  it('leaves the field alone when PLUTO has no usable classification', () => {
    expect(inferPropertyTypeFromPluto(null)).toBeUndefined();
    expect(inferPropertyTypeFromPluto({})).toBeUndefined();
  });

  it('fills property type when applying a live lookup result', () => {
    const current = createDefaultDeal().property;
    expect(current.propertyType).toBe('3-family');
    const fields = propertyFieldsFromLookup(
      {
        query: '17928 142 AVENUE',
        retrievedAt: '2026-09-01T00:00:00.000Z',
        geocode: {
          label: '17928 142 AVENUE, Springfield Gardens, NY, USA',
          name: '17928 142 AVENUE',
          borough: 'Queens',
          postalcode: '11434',
          padBbl: '4130490059',
        },
        candidates: [],
        pluto: {
          bldgclass: 'A5',
          landuse: '1',
          unitsres: '1',
          unitstotal: '1',
          zonedist1: 'R3A',
          yearbuilt: '2005',
          bldgarea: '1148',
          lotarea: '2000',
          block: '13049',
          lot: '59',
        },
        violations: [],
        finding: 'records_require_review',
        notes: [],
      },
      current,
    );
    expect(fields.propertyType).toBe('1-family');
    expect(fields.officialUnitCount).toBe(1);
    expect(fields.zoning).toBe('R3A');
  });
});
