import type {
  ActivityRepository,
  CommunityActivityRepository,
  FollowRepository,
  ObjectType,
} from '@gmrlog/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { FOLLOW_REPOSITORY } from '../../follows/follows.tokens';

import { WORKER_ACTIVITY_REPOSITORY, WORKER_COMMUNITY_ACTIVITY_REPOSITORY } from './worker.tokens';

/**
 * Activity kinds eligible for durable home-feed fan-out (D3.21).
 * Maps onto Prisma `ActivityKind`; `objectType` may differ (e.g. like → target host).
 */
export type FeedFanoutKind =
  | 'post'
  | 'review'
  | 'collection'
  | 'tier_list'
  | 'friend'
  | 'achievement'
  | 'like'
  | 'comment'
  | 'wishlist'
  | 'profile_pin'
  | 'milestone'
  /** D3.24 EVENTS_V2 — event creation fan-out (home + community `events` tab). */
  | 'event';

export interface FeedFanoutInput {
  kind: FeedFanoutKind;
  objectId: string;
  actorId: string;
  occurredAt: Date;
  communityId?: string;
  /**
   * ObjectType for the activity row. Defaults from `kind` when the vocabularies
   * align (post/review/collection/tier_list/achievement/comment). Required for
   * like · friend · wishlist · profile_pin · milestone.
   */
  objectType?: ObjectType;
}

/**
 * Durable feed fan-out — creates ActivityItem, home FeedEntries, optional CommunityActivity.
 */
@Injectable()
export class FeedFanoutService {
  constructor(
    @Inject(WORKER_ACTIVITY_REPOSITORY) private readonly activity: ActivityRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(WORKER_COMMUNITY_ACTIVITY_REPOSITORY)
    private readonly communityActivities: CommunityActivityRepository,
  ) {}

  async execute(input: FeedFanoutInput): Promise<void> {
    const objectType = resolveObjectType(input);
    const item = await this.activity.create({
      kind: input.kind,
      actor: { connect: { id: input.actorId } },
      objectType,
      objectId: input.objectId,
      occurredAt: input.occurredAt,
    });

    await this.activity.createFeedEntry({
      user: { connect: { id: input.actorId } },
      activityItem: { connect: { id: item.id } },
      rank: 0,
    });

    for (const follow of await this.follows.listFollowers(input.actorId)) {
      await this.activity.createFeedEntry({
        user: { connect: { id: follow.followerId } },
        activityItem: { connect: { id: item.id } },
        rank: 0,
      });
    }

    if (input.communityId != null) {
      await this.communityActivities.create({
        community: { connect: { id: input.communityId } },
        activityItem: { connect: { id: item.id } },
      });
    }
  }
}

function resolveObjectType(input: FeedFanoutInput): ObjectType {
  if (input.objectType !== undefined) {
    return input.objectType;
  }
  switch (input.kind) {
    case 'post':
    case 'review':
    case 'collection':
    case 'tier_list':
    case 'achievement':
    case 'comment':
    case 'event':
      return input.kind;
    case 'friend':
      return 'user';
    case 'wishlist':
      return 'game';
    case 'like':
    case 'profile_pin':
    case 'milestone':
      throw new BadRequestException(`objectType is required for activity kind ${input.kind}`);
    default: {
      const _exhaustive: never = input.kind;
      return _exhaustive;
    }
  }
}
