import type { CommunityRole } from '@gmrlog/database';

/**
 * Communities 2.0 permission matrix (docs/07_SOCIAL/COMMUNITIES_2.md).
 * Rank: member < moderator < admin < owner.
 */

const ROLE_RANK: Record<CommunityRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
};

export function communityRoleRank(role: CommunityRole): number {
  return ROLE_RANK[role];
}

export function hasAtLeastRole(role: CommunityRole, minimum: CommunityRole): boolean {
  return communityRoleRank(role) >= communityRoleRank(minimum);
}

/** Moderator+ — wiki edit · pin · remove others’ posts. */
export function canModerateCommunity(role: CommunityRole): boolean {
  return hasAtLeastRole(role, 'moderator');
}

/** Admin+ — settings · roles · join type. */
export function canAdministerCommunity(role: CommunityRole): boolean {
  return hasAtLeastRole(role, 'admin');
}

/** Owner only — delete community · transfer. */
export function canOwnCommunity(role: CommunityRole): boolean {
  return role === 'owner';
}

export function canEditWiki(role: CommunityRole): boolean {
  return canModerateCommunity(role);
}

export function canManagePins(role: CommunityRole): boolean {
  return canModerateCommunity(role);
}

export function canChangeMemberRoles(role: CommunityRole): boolean {
  return canAdministerCommunity(role);
}

export function canChangeJoinType(role: CommunityRole): boolean {
  return canAdministerCommunity(role);
}

export function canDeleteCommunity(role: CommunityRole): boolean {
  return canOwnCommunity(role);
}
