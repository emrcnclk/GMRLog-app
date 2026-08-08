import type { CommunityResponse } from '@gmrlog/types';

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
 * Only the member count exists — `CommunityCounts` is members-only ("MVP" in its
 * own doc comment) and nothing on the DTO reports posts or activity. The line
 * carries what is real and says nothing else; the two missing terms are tracked
 * as follow-ups on 3b.1 rather than filled with a plausible number.
 */
export function communityFooterLine(community: CommunityResponse): string {
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
