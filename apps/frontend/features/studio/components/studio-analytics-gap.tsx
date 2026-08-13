import { EmptyState } from '@gmrlog/ui';

/**
 * §23 draws four aggregates — a 2×2 KPI grid with deltas, a five-row
 * sentiment distribution, a player funnel, a cohort retention grid — under a
 * header naming a specific studio. Checked before writing any layout, the
 * same way §22's `TournamentBracketGap` did: read
 * `packages/database/prisma/schema.prisma` and `packages/types` directly
 * rather than guessing.
 *
 * **There is no studio account at all**, which is a wider gap than §22 had.
 * `grep -niE "studio|publisher|organi[sz]ation" schema.prisma` matches only
 * `Company` (D3.25 — catalog metadata crediting a `Game`, via `GameCompany`'s
 * `role: developer|publisher|...`), which has no relation to `User`, no
 * login, and no revenue/KPI/telemetry fields. There is no
 * organisation-account field on `User` or `UserPublicResponse` either — the
 * same absence `TASKS.md` §7.4 already recorded for a different screen. With
 * no way to determine "your studio," a viewer, there is nothing to scope any
 * of the four sections to, even the one with partial data underneath it.
 *
 * **Per-section reality, checked individually rather than assumed from the
 * header gap alone:**
 * - *KPI grid* (active users, revenue, deltas) — no schema support of any
 *   kind. No `revenue`, no active-user/DAU aggregate, no studio-scoped
 *   anything. `statistics.service.ts` computes per-user lifetime stats, not
 *   studio-level ones, and has no owner link to a studio regardless.
 * - *Sentiment* — the only section with a real column underneath it:
 *   `Review.rating` (`schema.prisma`) is a genuine 1–5 value, groupable by
 *   `gameId`. But rolling that up to "a studio's games" needs the
 *   `GameCompany` join *and* a studio identity to scope it to — neither
 *   exists, and no endpoint performs the aggregation today. Real data one
 *   layer down, still ungroundable at this layer.
 * - *Player funnel* (viewed → installed → played → retained) — no
 *   event/telemetry table anywhere. `GameLogKind` (`status_change | session |
 *   note`) is a personal log, not funnel instrumentation.
 * - *Cohort retention* — no cohort or retention concept in the schema at all.
 *
 * Building any of the four — even sentiment, the one with a real column
 * underneath — would mean either fabricating the studio scope client-side (a
 * client-invented aggregate CLAUDE.md's "scores are server-side" rule rules
 * out by the same logic as a match score) or shipping a component with
 * nothing wired to it, the "half-finished implementation" CLAUDE.md
 * separately forbids. Time-range pills are omitted for the identical reason:
 * with nothing behind any section, a pill that changes nothing on screen
 * would be decoration pretending to be a control.
 *
 * **Backend follow-up, tracked:** a studio/organisation account entity
 * (ownership of one or more `Game` rows, distinct from `Company`'s catalog
 * metadata) is the prerequisite every other piece depends on. Only once that
 * exists do the four aggregates — revenue/active-user KPIs, a
 * company-scoped rating rollup, install/play funnel events, cohort
 * retention — become meaningful follow-ups in their own right.
 */
export function StudioAnalyticsGap() {
  return (
    <EmptyState
      icon="activity"
      title="Studio analytics not available yet"
      description="KPIs, sentiment, the player funnel and cohort retention all need a studio account this app doesn't have yet."
      fill
    />
  );
}
