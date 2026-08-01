import type { ApiEnvelope, ApiErrorEnvelope, FeedItemResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';
import { createFakeBlockRepository } from '../blocks/testing/fake-repositories';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import { FRIENDSHIP_REPOSITORY } from '../friends/friends.tokens';
import { createFakeFriendshipRepository } from '../friends/testing/fake-repositories';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { MUTE_REPOSITORY } from '../mutes/mutes.tokens';
import { createFakeMuteRepository } from '../mutes/testing/fake-repositories';
import { createFakePostRepository, makePost } from '../posts/testing/fake-repositories';

import { ActivityModule } from './activity.module';
import { ACTIVITY_REPOSITORY, ACTIVITY_POST_REPOSITORY } from './activity.tokens';
import {
  createFakeActivityRepository,
  makeActivityItem,
  makeActor,
} from './testing/fake-repositories';

const activityRepo = createFakeActivityRepository();
const postsRepo = createFakePostRepository();
const followsRepo = createFakeFollowRepository();
const muteRepo = createFakeMuteRepository();
const blockRepo = createFakeBlockRepository();
const friendshipRepo = createFakeFriendshipRepository();

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, ActivityModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(ACTIVITY_REPOSITORY)
    .useValue(activityRepo)
    .overrideProvider(ACTIVITY_POST_REPOSITORY)
    .useValue(postsRepo)
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(followsRepo)
    .overrideProvider(MUTE_REPOSITORY)
    .useValue(muteRepo)
    .overrideProvider(BLOCK_REPOSITORY)
    .useValue(blockRepo)
    .overrideProvider(FRIENDSHIP_REPOSITORY)
    .useValue(friendshipRepo)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  activityRepo.items.clear();
  activityRepo.feedUserIds.clear();
  activityRepo.feedEntryIds.clear();
  activityRepo.actors.clear();
  postsRepo.rows.clear();
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('GET /feed', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({ method: 'GET', url: '/feed' });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('lists home feed inside the S1 list envelope', async () => {
    const actor = makeActor({ id: 'actor-1' });
    const item = makeActivityItem({
      id: 'a-1',
      actorId: 'actor-1',
      objectId: 'post-1',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    postsRepo.rows.set('post-1', makePost({ id: 'post-1', authorId: 'user-1' }));
    activityRepo.items.set(item.id, item);
    activityRepo.feedUserIds.set(item.id, 'user-1');
    activityRepo.feedEntryIds.set(item.id, 'feed-1');
    activityRepo.actors.set(actor.id, actor);

    const response = await app.inject({
      method: 'GET',
      url: '/feed?limit=1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<FeedItemResponse[]>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.meta.limit).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'feed-1',
      kind: 'post',
      projection: null,
      actor: { id: 'actor-1' },
      object: { type: 'post', id: 'post-1' },
    });
  });

  it('returns an empty feed when nothing exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/feed',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<FeedItemResponse[]>;
    expect(body.data).toEqual([]);
    expect(body.meta.hasMore).toBe(false);
  });
});
