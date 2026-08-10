import type { CommunityKindValue, CommunityResponse } from '@gmrlog/types';

import { isCommunityMember } from './community-model';

/**
 * `SCREEN_REDESIGNS_2.md` §13 — the Circles directory's own shaping.
 *
 * Pure functions, kept out of the screen so the partition and the two monospace
 * lines are testable without React Native in the module graph.
 */

export interface CommunityDirectorySections {
  /** §13's "Your circles" — membership is a field the API returns, not a score. */
  joined: CommunityResponse[];
  /** §13's "Suggested" — the rest of what `GET /communities` offered. */
  suggested: CommunityResponse[];
}

/**
 * Splits one list into §13's two sections.
 *
 * This is a partition on `viewerMembership`, **not** a ranking: `GET /communities`
 * already decides what a viewer may see (public circles plus their own), and the
 * client must never re-order or score that. What the section cannot claim is that
 * "Suggested" is *recommended* — see the follow-up on 3b.1.
 */
export function splitCommunityDirectory(items: CommunityResponse[]): CommunityDirectorySections {
  const joined: CommunityResponse[] = [];
  const suggested: CommunityResponse[] = [];
  for (const item of items) {
    if (isCommunityMember(item)) {
      joined.push(item);
    } else {
      suggested.push(item);
    }
  }
  return { joined, suggested };
}

/**
 * The title block's monospace line — the prototype's own "N joinable · 2 joined",
 * with "joinable" changed to "circles": the list includes the ones already
 * joined, so calling the total joinable would be wrong about half of it.
 */
export function communityDirectoryMeta(items: CommunityResponse[]): string {
  const joined = items.filter(isCommunityMember).length;
  return `${String(items.length)} ${items.length === 1 ? 'circle' : 'circles'} · ${String(joined)} joined`;
}

/**
 * §13's card footer: "members · posts today · a live dot when active".
 *
 * `postsToday` (3b.1e, BACKEND_CHANGES.md §6) lands here now; the live dot is
 * `activeNow`, rendered by the caller as its own element next to this line —
 * a dot is geometry, not text, the same call every other presence indicator in
 * this app makes (3.4's `PresenceRail`, 3.3's unread dot).
 */
export function communityFooterLine(community: CommunityResponse): string {
  const members = community.counts.members;
  const memberTerm = `${String(members)} ${members === 1 ? 'member' : 'members'}`;
  if (community.postsToday === undefined) {
    return memberTerm;
  }
  const posts = community.postsToday;
  return `${memberTerm} · ${String(posts)} ${posts === 1 ? 'post' : 'posts'} today`;
}

/**
 * §13's filter pills — the prototype's own `COMM_FILTERS`, "All" plus the four
 * kinds. "All" is not a `CommunityKind`: it is the absence of the `kind` query
 * param, so it stays a UI-only sentinel rather than a fifth enum value.
 */
export type CircleKindFilterValue = 'all' | CommunityKindValue;

/** Typed against `CommunityKindValue` so a pill can never drift from the DTO's enum. */
export const CIRCLE_KIND_FILTERS: readonly { value: CircleKindFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'games', label: 'Games' },
  { value: 'board_games', label: 'Board games' },
  { value: 'cosplay', label: 'Cosplay' },
  { value: 'live_events', label: 'Live events' },
];

/**
 * §13's "Active now" rail — a highlight over the same page already fetched,
 * the same relationship `splitCommunityDirectory` has to "Your circles" and
 * "Suggested". Not a separate query: `activeNow` is a rolling 3-hour window,
 * so the set it describes changes on its own between page loads regardless.
 */
export function activeNowCommunities(items: CommunityResponse[]): CommunityResponse[] {
  return items.filter((item) => item.activeNow === true);
}

/**
 * `SCREEN_REDESIGNS_2.md` §14's tab set, minus the one with no endpoint.
 *
 * §14 lists Feed / Members / Events / About. There is no route under
 * `/communities/{id}` that returns events — the `Event` model carries a
 * `communityId`, but nothing exposes it — so an Events tab could only ever
 * render an empty panel. Tracked on 3b.2 rather than shipped as furniture.
 */
export const COMMUNITY_DETAIL_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'members', label: 'Members' },
  { id: 'about', label: 'About' },
] as const;

export type CommunityDetailTabId = (typeof COMMUNITY_DETAIL_TABS)[number]['id'];

/**
 * §14's monospace meta line: "members · created · privacy".
 *
 * Only the first term exists. `CommunityResponse` projects no `createdAt`, and
 * `community-model.ts` records in its own comment that visibility is
 * deliberately not projected either — the API enforces it rather than
 * publishing it. So the line carries the member count and stops; the two
 * missing terms are a follow-up on 3b.2, not a `—` placeholder.
 */
export function communityDetailMeta(community: CommunityResponse): string {
  const members = community.counts.members;
  return `${String(members)} ${members === 1 ? 'member' : 'members'}`;
}

/**
 * §13's "one-line reason in accent monospace" under a suggested circle —
 * "3 friends here" (3b.1b).
 *
 * `null` when there is no reason to give: a guest (the field is absent), a
 * circle where none of the viewer's friends are members, or a circle the viewer
 * has already joined — "friends here" is an argument for joining, and it has no
 * work to do on a circle you are in.
 */
export function communityFriendReason(community: CommunityResponse): string | null {
  const friends = community.viewerFriendCount;
  if (friends === undefined || friends <= 0 || isCommunityMember(community)) {
    return null;
  }
  return `${String(friends)} ${friends === 1 ? 'friend' : 'friends'} here`;
}
