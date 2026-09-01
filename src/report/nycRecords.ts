import type { Deal } from '../models';

export interface RecordRow {
  topic: string;
  status: 'CHECKED' | 'NOT CHECKED' | 'ISSUE' | 'UNAVAILABLE';
  source: string;
  dateChecked: string;
  result: string;
}

function ddStatus(deal: Deal, matcher: RegExp): RecordRow['status'] {
  const item = deal.dueDiligence.find((entry) => matcher.test(entry.label));
  if (!item) return 'NOT CHECKED';
  if (item.status === 'issue_found') return 'ISSUE';
  if (item.status === 'verified' || item.status === 'resolved') return 'CHECKED';
  if (item.status === 'not_applicable') return 'UNAVAILABLE';
  return 'NOT CHECKED';
}

function ddMeta(deal: Deal, matcher: RegExp): { source: string; dateChecked: string; notes: string } {
  const item = deal.dueDiligence.find((entry) => matcher.test(entry.label));
  return {
    source: item?.source || 'User checklist',
    dateChecked: item?.dateChecked || '',
    notes: item?.notes || '',
  };
}

export function nycRecordsSummary(deal: Deal): RecordRow[] {
  const lookup = deal.property.lastLookupAt
    ? `Retrieved ${deal.property.lastLookupAt.slice(0, 10)}`
    : 'Not retrieved';
  return [
    {
      topic: 'PLUTO',
      status: deal.property.lastLookupAt ? 'CHECKED' : 'NOT CHECKED',
      source: deal.property.lastLookupSource || 'NYC Open Data',
      dateChecked: deal.property.lastLookupAt?.slice(0, 10) || '',
      result: deal.property.lastLookupAt
        ? `${deal.property.zoning || 'Zoning n/a'} · official units ${deal.property.officialUnitCount ?? 'n/a'} · ${lookup}`
        : 'No live PLUTO lookup has been stored on this deal.',
    },
    {
      topic: 'DOB',
      status: ddStatus(deal, /DOB/i),
      ...(() => {
        const meta = ddMeta(deal, /DOB records|DOB violations/i);
        return { source: meta.source, dateChecked: meta.dateChecked, result: meta.notes || deal.property.dobStatus };
      })(),
    },
    {
      topic: 'HPD',
      status: ddStatus(deal, /HPD/i),
      ...(() => {
        const meta = ddMeta(deal, /HPD/i);
        return { source: meta.source, dateChecked: meta.dateChecked, result: meta.notes || deal.property.hpdStatus };
      })(),
    },
    {
      topic: 'OATH / ECB',
      status: ddStatus(deal, /ECB|OATH/i),
      ...(() => {
        const meta = ddMeta(deal, /ECB|OATH/i);
        return { source: meta.source, dateChecked: meta.dateChecked, result: meta.notes || 'Sample status only — not a complete case file.' };
      })(),
    },
    {
      topic: 'DOF / property tax',
      status: ddStatus(deal, /tax|DOF|Finance/i),
      ...(() => {
        const meta = ddMeta(deal, /tax|DOF|Finance/i);
        return {
          source: meta.source,
          dateChecked: meta.dateChecked,
          result: meta.notes || `Tax source used: ${deal.property.tax?.sourceUsed ?? 'underwritten'}. Official bill pull is not implemented.`,
        };
      })(),
    },
    {
      topic: 'Certificate of Occupancy',
      status: ddStatus(deal, /Certificate of Occupancy/i),
      ...(() => {
        const meta = ddMeta(deal, /Certificate of Occupancy/i);
        return { source: meta.source, dateChecked: meta.dateChecked, result: meta.notes || deal.property.certificateOfOccupancyStatus };
      })(),
    },
    {
      topic: 'Zoning',
      status: deal.property.officialZoning || deal.property.zoning ? 'CHECKED' : ddStatus(deal, /Zoning/i),
      source: deal.property.lastLookupSource || 'User entered',
      dateChecked: deal.property.lastLookupAt?.slice(0, 10) || '',
      result: deal.property.zoning || 'Zoning not recorded.',
    },
    {
      topic: 'Rent regulation',
      status: ddStatus(deal, /Rent-regulation|Regulatory status/i),
      ...(() => {
        const meta = ddMeta(deal, /Rent-regulation|Regulatory status/i);
        return { source: meta.source, dateChecked: meta.dateChecked, result: meta.notes || 'DHCR registration is not pulled automatically.' };
      })(),
    },
  ];
}
