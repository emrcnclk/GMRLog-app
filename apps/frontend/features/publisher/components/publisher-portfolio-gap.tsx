import { EmptyState } from '@gmrlog/ui';

/**
 * §24 draws four sections under a header naming a specific publisher: a
 * 2×2 KPI grid, a titles list (cover, title, meta, a 2px health bar, a DAU
 * figure with a delta), cross-game migration (from-title → to-title with a
 * percentage), and market-opportunity insight cards. Checked before writing
 * any layout, the same way §23's `StudioAnalyticsGap` did: read
 * `packages/database/prisma/schema.prisma` and `packages/types` directly.
 *
 * **There is no publisher account at all**, the identical gap §23 recorded
 * for studios. `grep -niE "publisher|studio|organi[sz]ation"
 * schema.prisma` matches only `Company` (catalog metadata credited to a
 * `Game` via `GameCompany.role: developer|publisher|porting|supporting`),
 * which has no relation to `User`, no login, and no owner. There is no
 * organisation-account field on `User` or `UserPublicResponse` either. With
 * no way to determine "your publisher," a viewer, there is nothing to scope
 * any section to — including the titles list, the one section with a real
 * column underneath part of it.
 *
 * **Per-section reality, checked individually:**
 * - *KPI grid* — no revenue, no DAU/active-user aggregate, no
 *   publisher-scoped anything in `packages/types` (`grep -i
 *   "DAU|dailyActiveUsers|health|migration|marketOpportunity"` returns
 *   nothing).
 * - *Titles list* — `Company` → `GameCompany` (`role: publisher`) → `Game`
 *   → `GameMedia` gets a real cover, title and catalog meta. But the row
 *   §24 specifies is not that: it names a 2px health bar and a DAU figure
 *   with a delta as the row's own content, and neither exists anywhere —
 *   no telemetry table, no engagement/health column, on `Game` or
 *   elsewhere. A row with the cover and title but not the two numbers the
 *   spec built the row around is a different, invented design, not §24
 *   built "properly" — the same reasoning §23 applied to sentiment, the
 *   one section there with a real column (`Review.rating`) still
 *   ungroundable without a scope to roll it up to.
 * - *Cross-game migration* — no player-movement/funnel event of any kind
 *   in the schema (`GameLogKind` is `status_change | session | note`, a
 *   personal log, not cross-title instrumentation).
 * - *Market opportunity* — no insight-generation concept anywhere; this
 *   would be server-computed analysis with nothing to compute it from.
 *
 * **Backend follow-up, tracked:** a publisher/organisation account entity
 * (ownership of one or more `Company`/`Game` rows, distinct from
 * `Company`'s catalog metadata) is the prerequisite every other piece
 * depends on — the same prerequisite §23 named for studios. Only once that
 * exists do DAU/health telemetry, migration tracking and market-opportunity
 * insight become meaningful follow-ups in their own right.
 */
export function PublisherPortfolioGap() {
  return (
    <EmptyState
      icon="folder"
      title="Publisher portfolio not available yet"
      description="Titles, cross-game migration and market opportunity all need a publisher account this app doesn't have yet."
      fill
    />
  );
}
