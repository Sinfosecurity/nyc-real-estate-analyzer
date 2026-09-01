import { describe, expect, it } from 'vitest';
import { analyzeDeal } from '../calculations/analyze';
import { createBlankDeal, createDefaultDeal, createSyntheticExampleDeal } from '../constants/defaults';
import {
  excludedMonthlyRent,
  nextBestAction,
  plainEnglishSignal,
  verifiedMonthlyRent,
  whyNumbersAreLow,
} from '../ux/narrative';
import { calculateGuidedProgress, firstIncompleteStep } from '../ux/progress';

describe('guided UX helpers', () => {
  it('translates official classifications into plain English', () => {
    expect(plainEnglishSignal('INVESTIGATE').headline).toMatch(/investigation/i);
    expect(plainEnglishSignal('PASS').headline).toMatch(/fails/i);
    expect(plainEnglishSignal('STRONG REVIEW').headline).toMatch(/promising/i);
  });

  it('keeps unverified units out of verified monthly rent', () => {
    const deal = createDefaultDeal();
    deal.units[1].legalOccupancyVerified = false;
    deal.units[1].incomeStatus = 'unverified';
    deal.units[2].legalOccupancyVerified = false;
    deal.units[2].incomeStatus = 'unverified';
    expect(verifiedMonthlyRent(deal)).toBe(3200);
    expect(excludedMonthlyRent(deal)).toBe(3100 + 2900);
    expect(whyNumbersAreLow(deal)).toMatch(/only 1 currently qualify/i);
  });

  it('points a brand-new deal at entering an address', () => {
    const deal = createBlankDeal();
    const analysis = analyzeDeal(deal);
    expect(nextBestAction(deal, analysis)).toMatch(/address/i);
    const progress = calculateGuidedProgress(deal, analysis);
    expect(progress.readyToAnalyze).toBe(false);
    expect(firstIncompleteStep(progress)).toBe('property');
  });

  it('uses the same engine for the synthetic example as the golden fixture', () => {
    const example = analyzeDeal(createSyntheticExampleDeal());
    const fixture = analyzeDeal(createDefaultDeal());
    expect(example.gri).toBe(fixture.gri);
    expect(example.noi).toBe(fixture.noi);
    expect(example.health.signal).toBe(fixture.health.signal);
  });
});
