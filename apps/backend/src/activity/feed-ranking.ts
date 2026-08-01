/**
 * D3.24 deterministic FeedScore (FEED_ENGINE_V2.md).
 * friendWeight > followWeight. No AI.
 */

export const FEED_RANKING_WEIGHTS = {
  freshnessMax: 40,
  friendWeight: 30,
  followWeight: 15,
  communityWeight: 12,
  gameWeight: 12,
  interactionVelocity: 8,
  discoveryBoost: 5,
  userSimilarity: 10,
  interestOverlap: 14,
} as const;

export interface FeedScoreInput {
  occurredAt: Date;
  now?: Date;
  isFriend: boolean;
  isFollowing: boolean;
  sharedCommunityCount: number;
  sharedGameOverlap: number;
  interactionCount: number;
  discoveryEligible: boolean;
  userSimilarity: number;
  interestOverlap: number;
}

export function computeFeedScore(input: FeedScoreInput): number {
  const now = input.now ?? new Date();
  const ageHours = Math.max(0, (now.getTime() - input.occurredAt.getTime()) / 3_600_000);
  const freshness = Math.max(0, FEED_RANKING_WEIGHTS.freshnessMax - ageHours * 0.5);

  const friend = input.isFriend ? FEED_RANKING_WEIGHTS.friendWeight : 0;
  const follow = !input.isFriend && input.isFollowing ? FEED_RANKING_WEIGHTS.followWeight : 0;
  const community = Math.min(FEED_RANKING_WEIGHTS.communityWeight, input.sharedCommunityCount * 4);
  const game = Math.min(FEED_RANKING_WEIGHTS.gameWeight, input.sharedGameOverlap * 3);
  const velocity = Math.min(FEED_RANKING_WEIGHTS.interactionVelocity, input.interactionCount * 0.5);
  const discovery = input.discoveryEligible ? FEED_RANKING_WEIGHTS.discoveryBoost : 0;
  const similarity = Math.min(
    FEED_RANKING_WEIGHTS.userSimilarity,
    Math.max(0, input.userSimilarity) * FEED_RANKING_WEIGHTS.userSimilarity,
  );
  const interest = Math.min(
    FEED_RANKING_WEIGHTS.interestOverlap,
    Math.max(0, input.interestOverlap) * FEED_RANKING_WEIGHTS.interestOverlap,
  );

  return (
    freshness + friend + follow + community + game + velocity + discovery + similarity + interest
  );
}

/**
 * Assert product invariant friendWeight > followWeight. The comparison is
 * statically true for the current literal weights; it guards future edits.
 */
export function assertFriendOutranksFollow(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return FEED_RANKING_WEIGHTS.friendWeight > FEED_RANKING_WEIGHTS.followWeight;
}
