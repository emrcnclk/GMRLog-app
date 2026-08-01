import { describe, expect, it } from 'vitest';

import { assertFriendOutranksFollow, computeFeedScore, FEED_RANKING_WEIGHTS } from './feed-ranking';

describe('feed-ranking', () => {
  it('keeps friendWeight > followWeight', () => {
    expect(assertFriendOutranksFollow()).toBe(true);
    expect(FEED_RANKING_WEIGHTS.friendWeight).toBeGreaterThan(FEED_RANKING_WEIGHTS.followWeight);
  });

  it('scores friends higher than follows for same freshness', () => {
    const occurredAt = new Date();
    const friend = computeFeedScore({
      occurredAt,
      isFriend: true,
      isFollowing: false,
      sharedCommunityCount: 0,
      sharedGameOverlap: 0,
      interactionCount: 0,
      discoveryEligible: false,
      userSimilarity: 0,
      interestOverlap: 0,
    });
    const follow = computeFeedScore({
      occurredAt,
      isFriend: false,
      isFollowing: true,
      sharedCommunityCount: 0,
      sharedGameOverlap: 0,
      interactionCount: 0,
      discoveryEligible: false,
      userSimilarity: 0,
      interestOverlap: 0,
    });
    expect(friend).toBeGreaterThan(follow);
  });

  it('applies interestOverlap boost', () => {
    const occurredAt = new Date();
    const base = computeFeedScore({
      occurredAt,
      isFriend: false,
      isFollowing: false,
      sharedCommunityCount: 0,
      sharedGameOverlap: 0,
      interactionCount: 0,
      discoveryEligible: true,
      userSimilarity: 0,
      interestOverlap: 0,
    });
    const boosted = computeFeedScore({
      occurredAt,
      isFriend: false,
      isFollowing: false,
      sharedCommunityCount: 0,
      sharedGameOverlap: 0,
      interactionCount: 0,
      discoveryEligible: true,
      userSimilarity: 0,
      interestOverlap: 1,
    });
    expect(boosted).toBeGreaterThan(base);
  });
});
