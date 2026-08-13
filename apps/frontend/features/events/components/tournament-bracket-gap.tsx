import { EmptyState } from '@gmrlog/ui';

/**
 * §22 draws a bracket (rounds → matches → per-side scores, a live-match
 * border), a Seats/Prize/Round metric strip, and a watch-party card (viewer
 * count, voice state, a Join pill). None of it has a backend source: there is
 * no `Match`/`Round`/`Bracket` Prisma model, `EventResponse` carries no
 * seats/prize/round fields, and there is no viewer-count or voice-state
 * concept anywhere in the schema — confirmed by reading
 * `packages/database/prisma/schema.prisma` and `packages/types`, the same
 * check `EventCard` (§21) recorded for its own gaps.
 *
 * Rather than fabricate rounds, scores or a watching count on the client —
 * scores are server-side per CLAUDE.md, and a client-invented number would
 * disagree across two devices by construction — this renders the one honest
 * state available: the section doesn't exist yet. Backend follow-up: a
 * bracket structure keyed to `Event` (rounds, matches, sides, scores,
 * winner, a per-match live flag) plus a watch-party viewer/voice aggregate,
 * the same shape 3b.9 flagged for `EventParticipation`-derived attendee
 * counts.
 */
export function TournamentBracketGap() {
  return (
    <EmptyState
      icon="trophy"
      title="Bracket not available yet"
      description="Round pairings, scores and the watch party need bracket data this app doesn't have yet."
    />
  );
}
