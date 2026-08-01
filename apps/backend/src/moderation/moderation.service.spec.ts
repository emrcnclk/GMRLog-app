import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { ModerationService } from './moderation.service';
import {
  createActiveIdLookup,
  createFakeModerationCaseRepository,
  createFakeReportRepository,
  createFakeUserRepository,
  makeUser,
  type FakeModerationCaseRepository,
  type FakeReportRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

let reports: FakeReportRepository;
let cases: FakeModerationCaseRepository;
let users: FakeUserRepository;
let posts: ReturnType<typeof createActiveIdLookup>;
let service: ModerationService;

beforeEach(() => {
  reports = createFakeReportRepository();
  cases = createFakeModerationCaseRepository();
  users = createFakeUserRepository([
    makeUser({ id: 'user-1' }),
    makeUser({ id: 'user-2', handle: 'target' }),
  ]);
  posts = createActiveIdLookup([{ id: 'post-1' }]);
  const empty = createActiveIdLookup();
  service = new ModerationService(
    reports,
    cases,
    users,
    posts as never,
    empty as never,
    empty as never,
    empty as never,
    empty as never,
    empty as never,
  );
});

describe('ModerationService.createReport', () => {
  it('creates a report and opens a moderation case for user targets', async () => {
    const response = await service.createReport('user-1', {
      targetType: 'user',
      targetId: 'user-2',
      reason: 'spam',
    });

    expect(response).toMatchObject({
      targetType: 'user',
      targetId: 'user-2',
      reason: 'spam',
      status: 'open',
    });
    expect(cases.rows.size).toBe(1);
    const moderationCase = [...cases.rows.values()][0];
    expect(moderationCase).toMatchObject({
      reportId: response.id,
      subjectType: 'user',
      subjectId: 'user-2',
      status: 'open',
    });
  });

  it('rejects self-reports', async () => {
    await expect(
      service.createReport('user-1', {
        targetType: 'user',
        targetId: 'user-1',
        reason: 'harassment',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate open reports', async () => {
    await service.createReport('user-1', {
      targetType: 'user',
      targetId: 'user-2',
      reason: 'spam',
    });
    await expect(
      service.createReport('user-1', {
        targetType: 'user',
        targetId: 'user-2',
        reason: 'other',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing targets', async () => {
    await expect(
      service.createReport('user-1', {
        targetType: 'post',
        targetId: 'missing-post',
        reason: 'spam',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('accepts details without failing when S2 has no details column', async () => {
    const response = await service.createReport('user-1', {
      targetType: 'post',
      targetId: 'post-1',
      reason: 'nsfw',
      details: 'extra context',
    });
    expect(response.targetId).toBe('post-1');
    expect(cases.rows.size).toBe(1);
  });

  it('creates reports for review and comment targets', async () => {
    const reviews = createActiveIdLookup([{ id: 'review-1' }]);
    const comments = createActiveIdLookup([{ id: 'comment-1' }]);
    const extended = new ModerationService(
      reports,
      cases,
      users,
      posts as never,
      reviews as never,
      comments as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
    );

    await extended.createReport('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      reason: 'spoiler',
    });
    await extended.createReport('user-1', {
      targetType: 'comment',
      targetId: 'comment-1',
      reason: 'harassment',
    });
    expect(cases.rows.size).toBe(2);
  });

  it('creates reports for community and event targets', async () => {
    const communities = createActiveIdLookup([{ id: 'community-1' }]);
    const events = createActiveIdLookup([{ id: 'event-1' }]);
    const extended = new ModerationService(
      reports,
      cases,
      users,
      posts as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
      communities as never,
      events as never,
      createActiveIdLookup() as never,
    );

    await extended.createReport('user-1', {
      targetType: 'community',
      targetId: 'community-1',
      reason: 'other',
    });
    await extended.createReport('user-1', {
      targetType: 'event',
      targetId: 'event-1',
      reason: 'other',
    });
    expect(cases.rows.size).toBe(2);
  });

  it('accepts message targets without opening a moderation case', async () => {
    const messages = createActiveIdLookup([{ id: 'message-1' }]);
    const extended = new ModerationService(
      reports,
      cases,
      users,
      posts as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
      createActiveIdLookup() as never,
      messages as never,
    );

    const response = await extended.createReport('user-1', {
      targetType: 'message',
      targetId: 'message-1',
      reason: 'harassment',
    });
    expect(response.targetType).toBe('message');
    expect(cases.rows.size).toBe(0);
  });

  it('rejects inactive reporters', async () => {
    users.rows.set('user-1', makeUser({ id: 'user-1', deletedAt: new Date() }));
    await expect(
      service.createReport('user-1', {
        targetType: 'user',
        targetId: 'user-2',
        reason: 'spam',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
