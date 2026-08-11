import { describe, expect, it } from 'vitest';

import {
  findPlan,
  formatPlanPrice,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PLANS,
} from '../model/subscription-model';

describe('subscription model', () => {
  it('defines exactly monthly and annual', () => {
    expect(SUBSCRIPTION_PLANS.map((plan) => plan.id)).toEqual(['monthly', 'annual']);
  });

  it('prices annual at exactly ten months of the monthly rate, so "2 months free" is arithmetic', () => {
    const monthly = findPlan('monthly');
    const annual = findPlan('annual');
    expect(annual.priceCents).toBe(monthly.priceCents * 10);
  });

  it('only annual carries a savings note', () => {
    expect(findPlan('monthly').savingsNote).toBeNull();
    expect(findPlan('annual').savingsNote).not.toBeNull();
  });

  it('formats whole-dollar cents with two decimals', () => {
    expect(formatPlanPrice(499)).toBe('$4.99');
    expect(formatPlanPrice(4990)).toBe('$49.90');
  });

  it('throws on an unknown plan id rather than returning undefined silently', () => {
    // @ts-expect-error deliberate invalid id
    expect(() => findPlan('lifetime')).toThrow();
  });

  it('features are grounded in existing copy, not invented', () => {
    expect(SUBSCRIPTION_FEATURES.length).toBeGreaterThan(0);
    expect(SUBSCRIPTION_FEATURES.some((feature) => feature.includes('widgets'))).toBe(true);
  });
});
