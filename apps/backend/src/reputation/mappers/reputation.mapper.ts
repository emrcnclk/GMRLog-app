import type { UserReputation } from '@gmrlog/database';
import type { UserReputationResponse } from '@gmrlog/types';

/** Persistence → D3.24 UserReputationResponse (REPUTATION.md). */
export function toUserReputationResponse(row: UserReputation): UserReputationResponse {
  return {
    badge: row.badge,
    awardedAt: row.awardedAt.toISOString(),
  };
}
