/**
 * 3b.5 Subscription — `SCREEN_REDESIGNS_2.md` §17. Pure content and math only;
 * the screen renders this, nothing more.
 *
 * There is no subscription backend anywhere in this repo — no schema model,
 * no DTO, no route (confirmed by grepping `apps/backend`, `packages/database`,
 * `packages/validators`, `packages/types` for `subscription`/`billing`/
 * `stripe`/`iap` before writing this file; nothing matches but this comment).
 * §17 itself never says otherwise: "Cosmetics and tooling only" is about what
 * Pro is allowed to sell, not a claim that a purchase endpoint exists. So this
 * screen has exactly one real state — **not subscribed**, the only one any
 * data source can back — plus the plan-selection interaction, which is local
 * UI state with nothing to persist to. It does not fabricate a "subscribed"
 * view (no field anywhere says a viewer already is one) or a fault state for
 * a request this screen never makes.
 */

export type SubscriptionPlanId = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  label: string;
  /** Price in whole cents, so "2 months free" can be checked in arithmetic, not eyeballed. */
  priceCents: number;
  period: string;
  /** Annual only — the doc's own "2 months free" badge. */
  savingsNote: string | null;
}

const MONTHLY_PRICE_CENTS = 499;

/**
 * Annual priced at exactly ten months of the monthly rate, so "2 months free"
 * (§17) is arithmetic fact rather than marketing rounding.
 */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    priceCents: MONTHLY_PRICE_CENTS,
    period: '/ mo',
    savingsNote: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    priceCents: MONTHLY_PRICE_CENTS * 10,
    period: '/ yr',
    savingsNote: '2 months free',
  },
];

/** Grounded in `pro-card.tsx`'s existing copy plus §18's "Pro-only" card styles — no benefit invented past what those already name. */
export const SUBSCRIPTION_FEATURES: readonly string[] = [
  'Home screen widgets',
  'Every profile theme, card style and banner, including Pro-only sets',
  'Unlimited collections and tier lists',
];

export function findPlan(id: SubscriptionPlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((candidate) => candidate.id === id);
  if (plan === undefined) {
    throw new Error(`Unknown subscription plan: ${id}`);
  }
  return plan;
}

/** `$4.99`, `$49.90` — cents to a two-decimal dollar string, no locale/currency formatting (out of scope for placeholder pricing with no backend behind it). */
export function formatPlanPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}
