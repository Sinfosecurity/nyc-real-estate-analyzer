import type { Deal } from '../models';
import { isBaseCaseUnit } from './income';

export function calculateCompletion(deal: Deal): Record<string, number> {
  const propertyFields = [
    deal.property.address,
    deal.property.borough,
    deal.property.block,
    deal.property.lot,
    deal.property.propertyType,
  ];
  const propertyPct = Math.round(
    (propertyFields.filter((v) => v !== '' && v !== null && v !== undefined).length / propertyFields.length) * 100,
  );

  const rentRollPct = deal.units.length === 0 ? 0 : 100;

  const expenseFilled = deal.expenses.filter((e) => e.annualAmount > 0 || e.percentOfEgi > 0).length;
  const expensesPct = Math.round((expenseFilled / Math.max(1, deal.expenses.length)) * 100);

  const legalUnits = deal.units.filter((u) => isBaseCaseUnit(u));
  const verified = deal.units.filter((u) => (u.incomeStatus ?? (u.legalOccupancyVerified ? 'verified' : 'unverified')) === 'verified');
  const legalPct = deal.units.length === 0 ? 0 : Math.round((verified.length / deal.units.length) * 100);

  const dd = deal.dueDiligence;
  const ddDone = dd.filter((item) => item.status === 'verified' || item.status === 'not_applicable' || item.status === 'resolved').length;
  const diligencePct = dd.length === 0 ? 0 : Math.round((ddDone / dd.length) * 100);

  return {
    property: propertyPct,
    rentRoll: rentRollPct,
    expenses: expensesPct,
    legal: legalPct,
    dueDiligence: diligencePct,
    legalUnitsUnderwritten: legalUnits.length,
  };
}
