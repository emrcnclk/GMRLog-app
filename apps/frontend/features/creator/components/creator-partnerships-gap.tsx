import { EmptyState } from '@gmrlog/ui';

/**
 * §25's "Partnerships" — rows of a 36px cover, title, kind in monospace, and a
 * mandatory "Disclosed" plate that "must never be styled quiet" (the same law
 * §3b.9's `Sponsored` plate follows).
 *
 * No partnership/sponsorship entity exists anywhere in the schema — grepped
 * `packages/database/prisma/schema.prisma` for `partner|sponsor|disclos`,
 * matches none. `User`, `Collection` and `Review` all relate directly to a
 * creator; nothing does for a paid or in-kind partnership. Per this task's own
 * brief ("if the partnership data doesn't exist, gap the section; do not ship
 * partnership rows without the plate"), this renders one honest empty state
 * rather than a `PartnershipRow` component with nothing to wire it to — the
 * same "no half-finished implementation" call `TournamentBracketGap` makes.
 *
 * Backend follow-up: a `CreatorPartnership` entity (cover, title, kind,
 * disclosure status) keyed to a creator `User`.
 */
export function CreatorPartnershipsGap() {
  return (
    <EmptyState
      icon="folder"
      title="No partnerships to show"
      description="Disclosed partnerships this creator runs will appear here once that data exists."
    />
  );
}
