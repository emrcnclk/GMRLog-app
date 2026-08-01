import type {
  CommunityBadgeKind,
  CommunityMember,
  CommunityMemberBadge,
  CommunityMemberBadgeRepository,
  CommunityWikiRepository,
  PostRepository,
  User,
} from '@gmrlog/database';
import { COMMUNITY_TOP_CONTRIBUTOR_MIN_SCORE } from '@gmrlog/validators';

/**
 * Deterministic community reputation badges (COMMUNITIES_2.md).
 * No manual admin assignment for reputation-like badges beyond role-derived ones.
 */

const MODERATOR_ROLES = new Set(['moderator', 'admin']);

export async function ensureBadge(
  badges: CommunityMemberBadgeRepository,
  member: CommunityMember,
  kind: CommunityBadgeKind,
): Promise<CommunityMemberBadge> {
  const existing = await badges.findByMemberAndKind(member.id, kind);
  if (existing) {
    return existing;
  }
  return badges.create({
    member: { connect: { id: member.id } },
    community: { connect: { id: member.communityId } },
    kind,
  });
}

export async function revokeBadge(
  badges: CommunityMemberBadgeRepository,
  memberId: string,
  kind: CommunityBadgeKind,
): Promise<void> {
  const existing = await badges.findByMemberAndKind(memberId, kind);
  if (existing) {
    await badges.delete(existing.id);
  }
}

/**
 * Sync role-derived + verified_creator badges for a single membership.
 * Call on join and role change. Does not recompute top_contributor (community-wide).
 */
export async function syncMemberRoleBadges(
  badges: CommunityMemberBadgeRepository,
  member: CommunityMember,
  user: User,
): Promise<void> {
  if (member.role === 'owner') {
    await ensureBadge(badges, member, 'founder');
  } else {
    await revokeBadge(badges, member.id, 'founder');
  }

  if (MODERATOR_ROLES.has(member.role)) {
    await ensureBadge(badges, member, 'moderator');
  } else {
    await revokeBadge(badges, member.id, 'moderator');
  }

  if (user.creatorFeatured) {
    await ensureBadge(badges, member, 'verified_creator');
  } else {
    await revokeBadge(badges, member.id, 'verified_creator');
  }
}

/**
 * Recompute top_contributor for the whole community (highest score ≥ threshold).
 * Also refreshes role/verified badges for all members.
 */
export async function syncCommunityBadges(input: {
  communityId: string;
  members: readonly CommunityMember[];
  usersById: ReadonlyMap<string, User>;
  badges: CommunityMemberBadgeRepository;
  posts: PostRepository;
  wiki: CommunityWikiRepository;
}): Promise<void> {
  for (const member of input.members) {
    const user = input.usersById.get(member.userId);
    if (user == null || user.deletedAt != null) {
      continue;
    }
    await syncMemberRoleBadges(input.badges, member, user);
  }

  const postCounts = await input.posts.countByCommunityGroupedByAuthor(input.communityId);
  const wikiCounts = await input.wiki.countByUpdatedBy(input.communityId);
  const scores = new Map<string, number>();

  for (const row of postCounts) {
    scores.set(row.authorId, (scores.get(row.authorId) ?? 0) + row.count);
  }
  for (const row of wikiCounts) {
    scores.set(row.updatedById, (scores.get(row.updatedById) ?? 0) + row.count);
  }

  let topUserId: string | null = null;
  let topScore = 0;
  for (const member of input.members) {
    const score = scores.get(member.userId) ?? 0;
    if (score < COMMUNITY_TOP_CONTRIBUTOR_MIN_SCORE) {
      continue;
    }
    if (
      topUserId === null ||
      score > topScore ||
      (score === topScore && member.userId.localeCompare(topUserId) < 0)
    ) {
      topUserId = member.userId;
      topScore = score;
    }
  }

  for (const member of input.members) {
    if (topUserId !== null && member.userId === topUserId) {
      await ensureBadge(input.badges, member, 'top_contributor');
    } else {
      await revokeBadge(input.badges, member.id, 'top_contributor');
    }
  }
}
