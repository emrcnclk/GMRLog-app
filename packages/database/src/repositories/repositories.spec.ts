import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createGame, createCommunity, createUser } from '../test-support/factories';
import { createTestDatabase, type TestDatabase } from '../test-support/db-harness';
import { PrismaCommentRepository } from './comment.repository';
import { PrismaCommunityMemberRepository } from './community-member.repository';
import { PrismaCommunityRepository } from './community.repository';
import { PrismaConversationParticipantRepository } from './conversation-participant.repository';
import { PrismaConversationRepository } from './conversation.repository';
import { PrismaDiscoverRepository } from './discover.repository';
import { PrismaActivityRepository } from './activity.repository';
import { PrismaCommunityActivityRepository } from './community-activity.repository';
import { PrismaEventRepository } from './event.repository';
import { PrismaEventParticipationRepository } from './event-participation.repository';
import { PrismaUploadRepository } from './upload.repository';
import { PrismaBlockRepository } from './block.repository';
import { PrismaReportRepository } from './report.repository';
import { PrismaModerationCaseRepository } from './moderation-case.repository';
import { PrismaAdminActionRepository } from './admin-action.repository';
import { PrismaSearchRepository } from './search.repository';
import { PrismaMessageRepository } from './message.repository';
import { PrismaCollectionEntryRepository } from './collection-entry.repository';
import { PrismaCollectionRepository } from './collection.repository';
import { PrismaConnectedAccountRepository } from './connected-account.repository';
import { PrismaFollowRepository } from './follow.repository';
import { PrismaGameRepository } from './game.repository';
import { PrismaLibraryEntryRepository } from './library-entry.repository';
import { PrismaGameLogRepository } from './game-log.repository';
import { PrismaNotificationRepository } from './notification.repository';
import { PrismaPostRepository } from './post.repository';
import { PrismaReactionRepository } from './reaction.repository';
import { PrismaReviewRepository } from './review.repository';
import { PrismaSessionRepository } from './session.repository';
import { PrismaTierListRepository } from './tier-list.repository';
import { PrismaTierSlotRepository } from './tier-slot.repository';
import { PrismaUserSettingsRepository } from './user-settings.repository';

let db: TestDatabase;

beforeAll(async () => {
  db = await createTestDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('GameRepository', () => {
  it('creates and finds by slug', async () => {
    const repo = new PrismaGameRepository(db.prisma);
    const game = await repo.create({ title: 'Hollow Knight', slug: 'hollow-knight' });
    expect(await repo.findBySlug('hollow-knight')).toMatchObject({ id: game.id });
  });

  it('finds detail with platforms and aggregates', async () => {
    const repo = new PrismaGameRepository(db.prisma);
    const game = await repo.create({
      title: 'Detail Game',
      slug: `detail-${Date.now().toString(36)}`,
    });
    const platform = await db.prisma.platform.create({
      data: { name: 'PC', slug: `pc-${Date.now().toString(36)}` },
    });
    await db.prisma.gamePlatform.create({
      data: { gameId: game.id, platformId: platform.id },
    });

    const detail = await repo.findDetailById(game.id);
    expect(detail).toMatchObject({
      game: { id: game.id },
      platforms: [{ id: platform.id, slug: platform.slug }],
      ratingCount: 0,
      libraryCount: 0,
    });
  });
});

describe('SessionRepository', () => {
  it('lists by user and revokes', async () => {
    const repo = new PrismaSessionRepository(db.prisma);
    const user = await createUser(db.prisma);
    const session = await repo.create({
      user: { connect: { id: user.id } },
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(await repo.listByUser(user.id)).toHaveLength(1);
    const revoked = await repo.revoke(session.id);
    expect(revoked.revokedAt).toBeInstanceOf(Date);
  });
});

describe('ConnectedAccountRepository', () => {
  it('finds by user and provider', async () => {
    const repo = new PrismaConnectedAccountRepository(db.prisma);
    const user = await createUser(db.prisma);
    await repo.create({
      user: { connect: { id: user.id } },
      provider: 'steam',
      status: 'connected',
      scopes: ['profile'],
    });

    const found = await repo.findByUserAndProvider(user.id, 'steam');
    expect(found?.status).toBe('connected');
  });
});

describe('UserSettingsRepository', () => {
  it('upserts settings per user and reads them back', async () => {
    const repo = new PrismaUserSettingsRepository(db.prisma);
    const user = await createUser(db.prisma);

    expect(await repo.findByUser(user.id)).toBeNull();

    const created = await repo.upsertByUser(user.id, { theme: 'dark' });
    expect(created.theme).toBe('dark');
    expect(created.reduceMotion).toBe(false);

    const updated = await repo.upsertByUser(user.id, { reduceMotion: true, locale: 'tr' });
    expect(updated.id).toBe(created.id);
    expect(updated.theme).toBe('dark');
    expect(updated.reduceMotion).toBe(true);
    expect(updated.locale).toBe('tr');

    const cleared = await repo.upsertByUser(user.id, { theme: null });
    expect(cleared.theme).toBeNull();
  });
});

describe('LibraryEntryRepository', () => {
  it('upserts the player↔game relationship and reads it back', async () => {
    const repo = new PrismaLibraryEntryRepository(db.prisma);
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);

    const entry = await repo.create({
      user: { connect: { id: user.id } },
      game: { connect: { id: game.id } },
      status: 'playing',
      source: 'manual',
    });

    expect(entry.version).toBe(0);
    expect(await repo.findByUserAndGame(user.id, game.id)).toMatchObject({ id: entry.id });
  });

  it('filters by status and groups counts for the hub summary', async () => {
    const repo = new PrismaLibraryEntryRepository(db.prisma);
    const user = await createUser(db.prisma);
    const playing = await createGame(db.prisma, { slug: 'lib-playing' });
    const wishlist = await createGame(db.prisma, { slug: 'lib-wishlist' });
    const backlog = await createGame(db.prisma, { slug: 'lib-backlog' });

    await repo.create({
      user: { connect: { id: user.id } },
      game: { connect: { id: playing.id } },
      status: 'playing',
      source: 'manual',
    });
    await repo.create({
      user: { connect: { id: user.id } },
      game: { connect: { id: wishlist.id } },
      status: 'wishlist',
      source: 'manual',
    });
    await repo.create({
      user: { connect: { id: user.id } },
      game: { connect: { id: backlog.id } },
      status: 'backlog',
      source: 'manual',
    });

    expect(await repo.listByUser(user.id, { status: 'wishlist' })).toHaveLength(1);
    const counts = await repo.countByUserGroupedByStatus(user.id);
    expect(counts.get('playing')).toBe(1);
    expect(counts.get('wishlist')).toBe(1);
    expect(counts.get('backlog')).toBe(1);
  });
});

describe('GameLogRepository', () => {
  it('appends logs under an entry and cascades with entry delete', async () => {
    const entries = new PrismaLibraryEntryRepository(db.prisma);
    const logs = new PrismaGameLogRepository(db.prisma);
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);

    const entry = await entries.create({
      user: { connect: { id: user.id } },
      game: { connect: { id: game.id } },
      status: 'owned',
      source: 'manual',
    });

    await logs.create({
      libraryEntry: { connect: { id: entry.id } },
      kind: 'status_change',
      occurredAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    expect(await logs.listByLibraryEntry(entry.id)).toHaveLength(1);

    await entries.delete(entry.id);
    expect(await logs.listByLibraryEntry(entry.id)).toHaveLength(0);
  });
});

describe('ReviewRepository', () => {
  it('excludes soft-deleted reviews from active listings and author/game lookups', async () => {
    const repo = new PrismaReviewRepository(db.prisma);
    const author = await createUser(db.prisma);
    const gameA = await createGame(db.prisma, { slug: 'review-a' });
    const gameB = await createGame(db.prisma, { slug: 'review-b' });

    const kept = await repo.create({
      author: { connect: { id: author.id } },
      game: { connect: { id: gameA.id } },
      rating: 9,
      visibility: 'public',
    });
    const gone = await repo.create({
      author: { connect: { id: author.id } },
      game: { connect: { id: gameB.id } },
      rating: 3,
      visibility: 'public',
    });
    await repo.softDelete(gone.id);

    expect((await repo.listByGame(gameA.id)).map((r) => r.id)).toEqual([kept.id]);
    expect(await repo.findActiveById(kept.id)).toMatchObject({ id: kept.id });
    expect(await repo.findActiveById(gone.id)).toBeNull();
    expect(await repo.findActiveByAuthorAndGame(author.id, gameA.id)).toMatchObject({
      id: kept.id,
    });
    expect(await repo.findActiveByAuthorAndGame(author.id, gameB.id)).toBeNull();
  });
});

describe('PostRepository', () => {
  it('lists active posts by author and game, and excludes soft-deleted', async () => {
    const repo = new PrismaPostRepository(db.prisma);
    const author = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const kept = await repo.create({
      author: { connect: { id: author.id } },
      game: { connect: { id: game.id } },
      body: 'kept',
      visibility: 'public',
    });
    const gone = await repo.create({
      author: { connect: { id: author.id } },
      game: { connect: { id: game.id } },
      body: 'gone',
      visibility: 'public',
    });
    await repo.softDelete(gone.id);

    expect((await repo.listByAuthor(author.id)).map((p) => p.id)).toEqual([kept.id]);
    expect((await repo.listByGame(game.id)).map((p) => p.id)).toEqual([kept.id]);
    expect(await repo.findActiveById(gone.id)).toBeNull();
  });
});

describe('CommentRepository', () => {
  it('lists active comments by host, soft-deletes, and lists replies in creation order', async () => {
    const repo = new PrismaCommentRepository(db.prisma);
    const author = await createUser(db.prisma);

    const root = await repo.create({
      author: { connect: { id: author.id } },
      hostType: 'review',
      hostId: 'review-123',
      body: 'root',
    });
    const reply = await repo.create({
      author: { connect: { id: author.id } },
      hostType: 'review',
      hostId: 'review-123',
      body: 'reply',
      parent: { connect: { id: root.id } },
    });
    const gone = await repo.create({
      author: { connect: { id: author.id } },
      hostType: 'review',
      hostId: 'review-123',
      body: 'gone',
    });
    await repo.softDelete(gone.id);

    const listed = await repo.listByHost('review', 'review-123');
    expect(listed.map((c) => c.id)).toEqual([root.id, reply.id]);
    expect(await repo.findActiveById(gone.id)).toBeNull();
    expect((await repo.listReplies(root.id)).map((c) => c.id)).toEqual([reply.id]);
  });
});

describe('ReactionRepository', () => {
  it('creates, finds by actor/target/kind, lists by target, and hard-deletes', async () => {
    const repo = new PrismaReactionRepository(db.prisma);
    const actor = await createUser(db.prisma);
    const created = await repo.create({
      actor: { connect: { id: actor.id } },
      targetType: 'post',
      targetId: 'post-1',
      kind: 'like',
    });

    expect(await repo.findById(created.id)).toMatchObject({ id: created.id, kind: 'like' });
    expect(await repo.findByActorAndTarget(actor.id, 'post', 'post-1', 'like')).toMatchObject({
      id: created.id,
    });
    expect(await repo.listByTarget('post', 'post-1')).toHaveLength(1);

    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    expect(await repo.listByTarget('post', 'post-1')).toHaveLength(0);
  });

  it('rejects duplicate actor/target/kind at the unique constraint', async () => {
    const repo = new PrismaReactionRepository(db.prisma);
    const actor = await createUser(db.prisma);
    const data = {
      actor: { connect: { id: actor.id } },
      targetType: 'review' as const,
      targetId: 'review-dup',
      kind: 'like',
    };
    await repo.create(data);
    await expect(repo.create(data)).rejects.toThrow();
  });
});

describe('CollectionRepository', () => {
  it('lists by owner / public and excludes soft-deleted', async () => {
    const repo = new PrismaCollectionRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const pub = await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Public',
      visibility: 'public',
    });
    await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Private',
      visibility: 'private',
    });
    const gone = await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Gone',
      visibility: 'public',
    });
    await repo.softDelete(gone.id);

    expect((await repo.listByOwner(owner.id)).map((c) => c.id).sort()).toEqual(
      [pub.id, (await repo.listByOwner(owner.id)).find((c) => c.title === 'Private')!.id].sort(),
    );
    expect((await repo.listPublicByOwner(owner.id)).map((c) => c.id)).toEqual([pub.id]);
    expect(await repo.findActiveById(gone.id)).toBeNull();
  });
});

describe('CollectionEntryRepository', () => {
  it('replaces entries in order, finds, and removes', async () => {
    const collections = new PrismaCollectionRepository(db.prisma);
    const entries = new PrismaCollectionEntryRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const gameA = await createGame(db.prisma, { slug: 'col-a' });
    const gameB = await createGame(db.prisma, { slug: 'col-b' });
    const collection = await collections.create({
      owner: { connect: { id: owner.id } },
      title: 'Shelf',
      visibility: 'public',
    });

    const replaced = await entries.replaceEntries(collection.id, [
      { gameId: gameB.id, position: 0, note: 'First' },
      { gameId: gameA.id, position: 1 },
    ]);
    expect(replaced.map((e) => e.gameId)).toEqual([gameB.id, gameA.id]);
    expect(await entries.findEntry(collection.id, gameB.id)).toMatchObject({ note: 'First' });

    await entries.removeEntry(collection.id, gameB.id);
    expect(await entries.listByCollection(collection.id)).toHaveLength(1);
  });
});

describe('TierListRepository', () => {
  it('lists by owner / public and excludes soft-deleted', async () => {
    const repo = new PrismaTierListRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const pub = await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Public',
      visibility: 'public',
    });
    await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Private',
      visibility: 'private',
    });
    const gone = await repo.create({
      owner: { connect: { id: owner.id } },
      title: 'Gone',
      visibility: 'public',
    });
    await repo.softDelete(gone.id);

    expect((await repo.listByOwner(owner.id)).map((t) => t.title).sort()).toEqual([
      'Private',
      'Public',
    ]);
    expect((await repo.listPublicByOwner(owner.id)).map((t) => t.id)).toEqual([pub.id]);
    expect(await repo.findActiveById(gone.id)).toBeNull();
  });
});

describe('TierSlotRepository', () => {
  it('replaces the board transactionally with ordered slots and games', async () => {
    const tierLists = new PrismaTierListRepository(db.prisma);
    const slots = new PrismaTierSlotRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const gameA = await createGame(db.prisma, { slug: 'tier-a' });
    const gameB = await createGame(db.prisma, { slug: 'tier-b' });
    const tierList = await tierLists.create({
      owner: { connect: { id: owner.id } },
      title: 'Board',
      visibility: 'public',
    });

    const board = await slots.replaceSlots(tierList.id, [
      {
        label: 'S',
        position: 0,
        games: [
          { gameId: gameB.id, position: 0 },
          { gameId: gameA.id, position: 1 },
        ],
      },
      { label: 'A', position: 1, games: [] },
    ]);

    expect(board.map((row) => row.slot.label)).toEqual(['S', 'A']);
    expect(board[0]?.games.map((g) => g.gameId)).toEqual([gameB.id, gameA.id]);
    expect(board[1]?.games).toHaveLength(0);

    const cleared = await slots.replaceSlots(tierList.id, []);
    expect(cleared).toHaveLength(0);
  });
});

describe('FollowRepository', () => {
  it('creates a directed follow, checks exists, orders oldest-first, and hard-deletes by pair', async () => {
    const repo = new PrismaFollowRepository(db.prisma);
    const a = await createUser(db.prisma);
    const b = await createUser(db.prisma);
    const c = await createUser(db.prisma);

    const first = await repo.create({
      follower: { connect: { id: a.id } },
      followee: { connect: { id: b.id } },
    });
    await db.prisma.follow.update({
      where: { id: first.id },
      data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const second = await repo.create({
      follower: { connect: { id: c.id } },
      followee: { connect: { id: b.id } },
    });
    await db.prisma.follow.update({
      where: { id: second.id },
      data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    expect(await repo.exists(a.id, b.id)).toBe(true);
    expect(await repo.exists(b.id, a.id)).toBe(false);
    expect(await repo.findByPair(a.id, b.id)).not.toBeNull();

    const followers = await repo.listFollowers(b.id);
    expect(followers.map((row) => row.followerId)).toEqual([a.id, c.id]);

    await repo.create({
      follower: { connect: { id: a.id } },
      followee: { connect: { id: c.id } },
    });
    const following = await repo.listFollowing(a.id);
    expect(following.map((row) => row.followeeId)).toEqual([b.id, c.id]);

    const deleted = await repo.deleteByPair(a.id, b.id);
    expect(deleted).not.toBeNull();
    expect(await repo.exists(a.id, b.id)).toBe(false);
    expect(await repo.deleteByPair(a.id, b.id)).toBeNull();
  });
});

describe('CommunityRepository', () => {
  it('soft-deletes communities, lists public, and discovers member communities', async () => {
    const repo = new PrismaCommunityRepository(db.prisma);
    const publicCommunity = await createCommunity(db.prisma, {
      name: 'Room',
      slug: `room-${Date.now().toString(36)}`,
    });
    const privateCommunity = await createCommunity(db.prisma, {
      name: 'Hidden',
      slug: `hidden-${Date.now().toString(36)}`,
    });
    await repo.update(privateCommunity.id, { visibility: 'private' });
    const owner = await createUser(db.prisma);
    const memberRepo = new PrismaCommunityMemberRepository(db.prisma);
    // Both fixtures get an owner because `createCommunity` (the service) always
    // writes one, and the directory lists now require it: an owner-less
    // community is readable by nobody, so it must be excluded before the page
    // is sliced rather than dropped afterwards.
    for (const community of [publicCommunity, privateCommunity]) {
      await memberRepo.create({
        community: { connect: { id: community.id } },
        user: { connect: { id: owner.id } },
        role: 'owner',
      });
    }

    expect(await repo.findActiveById(publicCommunity.id)).not.toBeNull();
    expect(
      (await repo.listPublic({ limit: 50 })).some((row) => row.id === publicCommunity.id),
    ).toBe(true);
    expect(
      (await repo.listDiscoverableForMemberCommunityIds([privateCommunity.id], { limit: 50 })).some(
        (row) => row.id === privateCommunity.id,
      ),
    ).toBe(true);

    // A page never exceeds its limit, and the cursor walks the same
    // `updatedAt desc, id desc` order the list is sorted by.
    const firstPage = await repo.listPublic({ limit: 1 });
    expect(firstPage).toHaveLength(1);
    const head = firstPage[0];
    expect(head).toBeDefined();
    if (head !== undefined) {
      const secondPage = await repo.listPublic({
        limit: 1,
        cursor: { updatedAt: head.updatedAt, id: head.id },
      });
      expect(secondPage.some((row) => row.id === head.id)).toBe(false);
    }

    await repo.softDelete(publicCommunity.id);
    expect(await repo.findActiveById(publicCommunity.id)).toBeNull();
    const after = await repo.findById(publicCommunity.id);
    expect(after?.deletedAt).toBeInstanceOf(Date);
  });

  it('finds by slug', async () => {
    const repo = new PrismaCommunityRepository(db.prisma);
    const slug = `slug-${Date.now().toString(36)}`;
    const created = await createCommunity(db.prisma, { name: 'Slug Room', slug });
    expect(await repo.findBySlug(slug)).toMatchObject({ id: created.id });
  });
});

describe('CommunityMemberRepository', () => {
  it('creates membership, orders oldest-first, and hard-deletes on leave', async () => {
    const communityRepo = new PrismaCommunityRepository(db.prisma);
    const memberRepo = new PrismaCommunityMemberRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const joiner = await createUser(db.prisma);
    const community = await communityRepo.create({
      name: 'Guild',
      slug: `guild-${Date.now().toString(36)}`,
    });

    const ownerMembership = await memberRepo.create({
      community: { connect: { id: community.id } },
      user: { connect: { id: owner.id } },
      role: 'owner',
    });
    await db.prisma.communityMember.update({
      where: { id: ownerMembership.id },
      data: { joinedAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const joinerMembership = await memberRepo.create({
      community: { connect: { id: community.id } },
      user: { connect: { id: joiner.id } },
      role: 'member',
    });
    await db.prisma.communityMember.update({
      where: { id: joinerMembership.id },
      data: { joinedAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    expect(await memberRepo.findByCommunityAndUser(community.id, joiner.id)).not.toBeNull();
    expect(await memberRepo.listCommunityIdsByUser(joiner.id)).toEqual([community.id]);
    expect(await memberRepo.countByCommunity(community.id)).toBe(2);

    const listed = await memberRepo.listByCommunity(community.id);
    expect(listed.map((row) => row.userId)).toEqual([owner.id, joiner.id]);

    const deleted = await memberRepo.deleteByCommunityAndUser(community.id, joiner.id);
    expect(deleted).not.toBeNull();
    expect(await memberRepo.findByCommunityAndUser(community.id, joiner.id)).toBeNull();
    expect(await memberRepo.deleteByCommunityAndUser(community.id, joiner.id)).toBeNull();
  });
});

describe('ConversationRepository', () => {
  it('lists inbox newest-first and touches lastMessageAt', async () => {
    const repo = new PrismaConversationRepository(db.prisma);
    const a = await createUser(db.prisma);
    const b = await createUser(db.prisma);
    const older = await repo.create({ kind: 'direct' });
    await db.prisma.conversation.update({
      where: { id: older.id },
      data: {
        lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    const newer = await repo.create({ kind: 'direct' });
    await db.prisma.conversation.update({
      where: { id: newer.id },
      data: {
        lastMessageAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });

    const participantRepo = new PrismaConversationParticipantRepository(db.prisma);
    for (const conversationId of [older.id, newer.id]) {
      await participantRepo.create({
        conversation: { connect: { id: conversationId } },
        user: { connect: { id: a.id } },
      });
      await participantRepo.create({
        conversation: { connect: { id: conversationId } },
        user: { connect: { id: b.id } },
      });
    }

    const inbox = await repo.listByParticipant(a.id);
    expect(inbox.map((row) => row.id)).toEqual([newer.id, older.id]);

    const touched = await repo.touchLastMessage(older.id, new Date('2026-01-03T00:00:00.000Z'));
    expect(touched.lastMessageAt?.toISOString()).toBe('2026-01-03T00:00:00.000Z');
  });
});

describe('ConversationParticipantRepository', () => {
  it('creates membership and orders participants oldest-first', async () => {
    const conversationRepo = new PrismaConversationRepository(db.prisma);
    const participantRepo = new PrismaConversationParticipantRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const joiner = await createUser(db.prisma);
    const conversation = await conversationRepo.create({ kind: 'direct' });

    const first = await participantRepo.create({
      conversation: { connect: { id: conversation.id } },
      user: { connect: { id: owner.id } },
    });
    await db.prisma.conversationParticipant.update({
      where: { id: first.id },
      data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const second = await participantRepo.create({
      conversation: { connect: { id: conversation.id } },
      user: { connect: { id: joiner.id } },
    });
    await db.prisma.conversationParticipant.update({
      where: { id: second.id },
      data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    expect(
      await participantRepo.findByConversationAndUser(conversation.id, joiner.id),
    ).not.toBeNull();
    const listed = await participantRepo.listByConversation(conversation.id);
    expect(listed.map((row) => row.userId)).toEqual([owner.id, joiner.id]);

    const readAt = new Date('2026-01-03T00:00:00.000Z');
    const updated = await participantRepo.updateLastReadAt(conversation.id, owner.id, readAt);
    expect(updated?.lastReadAt?.toISOString()).toBe(readAt.toISOString());
  });
});

describe('MessageRepository', () => {
  it('lists active messages oldest-first and hides soft-deleted rows', async () => {
    const conversationRepo = new PrismaConversationRepository(db.prisma);
    const messageRepo = new PrismaMessageRepository(db.prisma);
    const sender = await createUser(db.prisma);
    const peer = await createUser(db.prisma);
    const conversation = await conversationRepo.create({ kind: 'direct' });
    const participantRepo = new PrismaConversationParticipantRepository(db.prisma);
    await participantRepo.create({
      conversation: { connect: { id: conversation.id } },
      user: { connect: { id: sender.id } },
    });
    await participantRepo.create({
      conversation: { connect: { id: conversation.id } },
      user: { connect: { id: peer.id } },
    });

    const first = await messageRepo.create({
      conversation: { connect: { id: conversation.id } },
      sender: { connect: { id: sender.id } },
      body: 'First',
    });
    await db.prisma.message.update({
      where: { id: first.id },
      data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const second = await messageRepo.create({
      conversation: { connect: { id: conversation.id } },
      sender: { connect: { id: peer.id } },
      body: 'Second',
    });
    await db.prisma.message.update({
      where: { id: second.id },
      data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    const listed = await messageRepo.listByConversation(conversation.id);
    expect(listed.map((row) => row.body)).toEqual(['First', 'Second']);

    const page = await messageRepo.listByConversationCursor(conversation.id, { limit: 1 });
    expect(page.map((row) => row.body)).toEqual(['First']);
    const nextPage = await messageRepo.listByConversationCursor(conversation.id, {
      limit: 1,
      cursor: { createdAt: page[0]!.createdAt, id: page[0]!.id },
    });
    expect(nextPage.map((row) => row.body)).toEqual(['Second']);

    const latest = await messageRepo.findLatestActiveByConversation(conversation.id);
    expect(latest?.id).toBe(second.id);

    await db.prisma.message.update({
      where: { id: first.id },
      data: { deletedAt: new Date() },
    });
    const afterDelete = await messageRepo.listByConversation(conversation.id);
    expect(afterDelete.map((row) => row.id)).toEqual([second.id]);
  });
});

describe('DiscoverRepository', () => {
  it('lists public communities and active events with stable cursor pagination', async () => {
    const repo = new PrismaDiscoverRepository(db.prisma);
    const publicCommunity = await createCommunity(db.prisma, {
      name: 'Public',
      slug: `public-${Date.now().toString(36)}`,
    });
    const privateCommunity = await createCommunity(db.prisma, {
      name: 'Private',
      slug: `private-${Date.now().toString(36)}`,
    });
    await db.prisma.community.update({
      where: { id: privateCommunity.id },
      data: { visibility: 'private', updatedAt: new Date('2026-01-03T00:00:00.000Z') },
    });
    await db.prisma.community.update({
      where: { id: publicCommunity.id },
      data: { updatedAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    const olderEvent = await db.prisma.event.create({
      data: {
        title: 'Older',
        kind: 'seasonal',
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    const newerEvent = await db.prisma.event.create({
      data: {
        title: 'Newer',
        kind: 'tournament',
        startsAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });

    const communities = await repo.listDiscoverCommunities({ limit: 50 });
    expect(communities.some((row) => row.id === publicCommunity.id)).toBe(true);
    expect(communities.some((row) => row.id === privateCommunity.id)).toBe(false);

    const events = await repo.listDiscoverEvents({ limit: 10 });
    expect(events.map((row) => row.id)).toEqual([newerEvent.id, olderEvent.id]);

    const page1 = await repo.listDiscoverEvents({ limit: 1 });
    const page2 = await repo.listDiscoverEvents({
      limit: 1,
      cursor: { orderedAt: page1[0]!.startsAt, id: page1[0]!.id },
    });
    expect(page2[0]?.id).toBe(olderEvent.id);
  });

  it('lists discover games with catalog filters and cursor pagination', async () => {
    const repo = new PrismaDiscoverRepository(db.prisma);
    const stamp = Date.now().toString(36);
    const platform = await db.prisma.platform.create({
      data: { name: 'PC', slug: `pc-${stamp}` },
    });
    const genre = await db.prisma.genre.create({
      data: { name: 'RPG', slug: `rpg-${stamp}` },
    });
    const franchise = await db.prisma.franchise.create({
      data: { name: 'Saga', slug: `saga-${stamp}` },
    });
    const featuredGame = await db.prisma.game.create({
      data: {
        title: 'Featured Quest',
        slug: `featured-${stamp}`,
        featured: true,
        popularity: 20,
        releaseDate: new Date('2026-01-02T00:00:00.000Z'),
        franchiseId: franchise.id,
        genres: { create: [{ genreId: genre.id }] },
        platforms: { create: [{ platformId: platform.id }] },
      },
    });
    await db.prisma.game.create({
      data: {
        title: 'Older Quest',
        slug: `older-${stamp}`,
        featured: false,
        popularity: 5,
        releaseDate: new Date('2026-01-01T00:00:00.000Z'),
        franchiseId: franchise.id,
      },
    });

    const filtered = await repo.listDiscoverGames({
      limit: 10,
      sort: 'default',
      genreId: genre.id,
      platformId: platform.id,
      franchiseId: franchise.id,
    });
    expect(filtered.map((row) => row.game.id)).toEqual([featuredGame.id]);

    const page1 = await repo.listDiscoverGames({
      limit: 1,
      sort: 'default',
      franchiseId: franchise.id,
    });
    expect(page1.length).toBe(1);
    const page2 = await repo.listDiscoverGames({
      limit: 1,
      sort: 'default',
      franchiseId: franchise.id,
      cursor: {
        mode: 'default',
        featured: page1[0]!.game.featured,
        popularity: page1[0]!.game.popularity,
        releaseDate: page1[0]!.game.releaseDate,
        id: page1[0]!.game.id,
      },
    });
    expect(page2[0]?.game.id).not.toBe(page1[0]?.game.id);
  });
});

describe('SearchRepository', () => {
  it('matches games and users and excludes private posts for guests', async () => {
    const repo = new PrismaSearchRepository(db.prisma);
    const author = await createUser(db.prisma, { handle: 'author', displayName: 'Author' });
    const game = await createGame(db.prisma, {
      title: 'Searchable Game',
      slug: `search-game-${Date.now().toString(36)}`,
    });
    await db.prisma.post.create({
      data: {
        authorId: author.id,
        body: 'Searchable Game thoughts',
        visibility: 'public',
      },
    });
    await db.prisma.post.create({
      data: {
        authorId: author.id,
        body: 'Searchable Game secret',
        visibility: 'private',
      },
    });

    const guestHits = await repo.search({ query: 'Searchable', limit: 20, viewerId: null });
    const guestTypes = guestHits.map((row) => row.type);
    expect(guestTypes).toContain('game');
    expect(guestTypes).toContain('post');
    expect(guestHits.some((row) => row.type === 'post' && row.id)).toBe(true);
    expect(guestHits.filter((row) => row.type === 'post').length).toBe(1);

    const privateOnly = await repo.search({
      query: 'secret',
      limit: 20,
      viewerId: null,
    });
    expect(privateOnly).toEqual([]);
  });

  it('paginates merged hits with stable cursor ordering', async () => {
    const repo = new PrismaSearchRepository(db.prisma);
    const stamp = Date.now().toString(36);
    await createGame(db.prisma, {
      title: `Paged Alpha ${stamp}`,
      slug: `paged-alpha-${stamp}`,
    });
    await createUser(db.prisma, {
      handle: `paged-${stamp}`,
      displayName: `Paged Alpha ${stamp}`,
    });

    const page1 = await repo.search({ query: 'Paged Alpha', limit: 1, viewerId: null });
    expect(page1.length).toBe(2);
    const page2 = await repo.search({
      query: 'Paged Alpha',
      limit: 1,
      viewerId: null,
      cursor: { orderedAt: page1[0]!.orderedAt, type: page1[0]!.type, id: page1[0]!.id },
    });
    expect(page2[0]?.id).not.toBe(page1[0]?.id);
  });
});

describe('ActivityRepository', () => {
  it('lists user feed newest first and paginates by occurredAt', async () => {
    const repo = new PrismaActivityRepository(db.prisma);
    const user = await createUser(db.prisma);
    const olderItem = await repo.create({
      kind: 'post',
      objectType: 'post',
      objectId: 'post-a',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    await repo.createFeedEntry({
      user: { connect: { id: user.id } },
      activityItem: { connect: { id: olderItem.id } },
      rank: 1,
    });
    const newerItem = await repo.create({
      kind: 'post',
      objectType: 'post',
      objectId: 'post-b',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    await repo.createFeedEntry({
      user: { connect: { id: user.id } },
      activityItem: { connect: { id: newerItem.id } },
      rank: 2,
    });

    const listed = await repo.listForUser(user.id, { limit: 10 });
    expect(listed.map((row) => row.activityItem.id)).toEqual([newerItem.id, olderItem.id]);

    const page1 = await repo.listForUser(user.id, { limit: 1 });
    expect(page1.length).toBe(1);
    const page2 = await repo.listForUser(user.id, {
      limit: 1,
      cursor: {
        occurredAt: page1[0]!.activityItem.occurredAt,
        id: page1[0]!.activityItem.id,
      },
    });
    expect(page2[0]?.activityItem.id).toBe(olderItem.id);
  });

  it('listHomeFeed includes feed entry ids', async () => {
    const repo = new PrismaActivityRepository(db.prisma);
    const user = await createUser(db.prisma);
    const item = await repo.create({
      kind: 'post',
      objectType: 'post',
      objectId: 'post-feed',
      occurredAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    const feedEntry = await repo.createFeedEntry({
      user: { connect: { id: user.id } },
      activityItem: { connect: { id: item.id } },
      rank: 1,
    });

    const listed = await repo.listHomeFeed(user.id, { limit: 10 });
    expect(listed[0]).toMatchObject({
      feedEntryId: feedEntry.id,
      activityItem: { id: item.id },
    });
  });
});

describe('CommunityActivityRepository', () => {
  it('lists community activity newest first', async () => {
    const repo = new PrismaCommunityActivityRepository(db.prisma);
    const community = await createCommunity(db.prisma);
    const olderItem = await db.prisma.activityItem.create({
      data: {
        kind: 'post',
        objectType: 'post',
        objectId: 'post-old',
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    const newerItem = await db.prisma.activityItem.create({
      data: {
        kind: 'post',
        objectType: 'post',
        objectId: 'post-new',
        occurredAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });
    await repo.create({
      community: { connect: { id: community.id } },
      activityItem: { connect: { id: olderItem.id } },
    });
    await repo.create({
      community: { connect: { id: community.id } },
      activityItem: { connect: { id: newerItem.id } },
    });

    const listed = await repo.listByCommunity(community.id, { limit: 10 });
    expect(listed.map((row) => row.activityItem.id)).toEqual([newerItem.id, olderItem.id]);
    expect(listed[0]?.communityActivityId).toEqual(expect.any(String));
  });
});

describe('EventRepository', () => {
  it('creates, lists public newest-first, soft-deletes, and hides deleted from active reads', async () => {
    const repo = new PrismaEventRepository(db.prisma);
    const stamp = Date.now().toString(36);
    const older = await repo.create({
      title: `Seasonal-${stamp}`,
      kind: 'seasonal',
      startsAt: new Date('2099-01-01T00:00:00.000Z'),
    });
    const newer = await repo.create({
      title: `Tournament-${stamp}`,
      kind: 'tournament',
      startsAt: new Date('2099-01-02T00:00:00.000Z'),
    });

    const page1 = await repo.listPublic({ limit: 1 });
    expect(page1[0]?.id).toBe(newer.id);
    const page2 = await repo.listPublic({
      limit: 1,
      cursor: { startsAt: page1[0]!.startsAt, id: page1[0]!.id },
    });
    expect(page2[0]?.id).toBe(older.id);

    await repo.softDelete(newer.id);
    expect(await repo.findActiveById(newer.id)).toBeNull();
    expect(await repo.findById(newer.id)).not.toBeNull();
  });
});

describe('EventParticipationRepository', () => {
  it('joins, lists, and hard-deletes leave', async () => {
    const events = new PrismaEventRepository(db.prisma);
    const participations = new PrismaEventParticipationRepository(db.prisma);
    const user = await createUser(db.prisma);
    const event = await events.create({
      title: 'Joinable',
      kind: 'game',
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const row = await participations.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      state: 'going',
    });
    expect(row.state).toBe('going');

    const listed = await participations.listByEvent(event.id);
    expect(listed.map((p) => p.id)).toEqual([row.id]);

    const left = await participations.deleteByEventAndUser(event.id, user.id);
    expect(left?.id).toBe(row.id);
    expect(await participations.findByEventAndUser(event.id, user.id)).toBeNull();
  });

  /** 9.4 — `attendeeCount` on `EventResponse`. going/hosting only, batched by eventId. */
  it('counts only going/hosting participants, batched by eventId', async () => {
    const events = new PrismaEventRepository(db.prisma);
    const participations = new PrismaEventParticipationRepository(db.prisma);
    const going = await createUser(db.prisma);
    const hosting = await createUser(db.prisma);
    const interested = await createUser(db.prisma);
    const declined = await createUser(db.prisma);

    const full = await events.create({
      title: 'Packed House',
      kind: 'game',
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const empty = await events.create({
      title: 'Empty Lobby',
      kind: 'game',
      startsAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await participations.create({
      event: { connect: { id: full.id } },
      user: { connect: { id: going.id } },
      state: 'going',
    });
    await participations.create({
      event: { connect: { id: full.id } },
      user: { connect: { id: hosting.id } },
      state: 'hosting',
    });
    await participations.create({
      event: { connect: { id: full.id } },
      user: { connect: { id: interested.id } },
      state: 'interested',
    });
    await participations.create({
      event: { connect: { id: full.id } },
      user: { connect: { id: declined.id } },
      state: 'not_going',
    });

    const counts = await participations.countAttendeesByEvents([full.id, empty.id]);
    expect(counts.find((row) => row.eventId === full.id)?.count).toBe(2);
    expect(counts.some((row) => row.eventId === empty.id)).toBe(false);
    expect(await participations.countAttendeesByEvents([])).toEqual([]);
  });
});

describe('UploadRepository', () => {
  it('creates grants, finds by owner, and updates status to confirmed', async () => {
    const repo = new PrismaUploadRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const other = await createUser(db.prisma);

    const grant = await repo.create({
      owner: { connect: { id: owner.id } },
      purpose: 'avatar',
      storageKey: `uploads/${owner.id}/avatar-1`,
      status: 'granted',
    });

    expect(await repo.findById(grant.id)).toMatchObject({
      id: grant.id,
      purpose: 'avatar',
      status: 'granted',
    });
    expect(await repo.findByOwnerAndId(owner.id, grant.id)).not.toBeNull();
    expect(await repo.findByOwnerAndId(other.id, grant.id)).toBeNull();

    const confirmed = await repo.updateStatus(grant.id, 'confirmed');
    expect(confirmed.status).toBe('confirmed');

    const listed = await repo.listByOwner(owner.id);
    expect(listed.map((row) => row.id)).toEqual([grant.id]);
  });

  it('expires granted uploads older than a cutoff', async () => {
    const repo = new PrismaUploadRepository(db.prisma);
    const owner = await createUser(db.prisma);
    const stale = await repo.create({
      owner: { connect: { id: owner.id } },
      purpose: 'avatar',
      storageKey: `uploads/${owner.id}/stale`,
      status: 'granted',
    });
    await db.prisma.upload.update({
      where: { id: stale.id },
      data: { createdAt: new Date('2020-01-01T00:00:00.000Z') },
    });
    const fresh = await repo.create({
      owner: { connect: { id: owner.id } },
      purpose: 'banner',
      storageKey: `uploads/${owner.id}/fresh`,
      status: 'granted',
    });

    const count = await repo.expireGrantedOlderThan(new Date('2021-01-01T00:00:00.000Z'));
    expect(count).toBe(1);
    expect((await repo.findById(stale.id))?.status).toBe('expired');
    expect((await repo.findById(fresh.id))?.status).toBe('granted');
  });
});

describe('BlockRepository', () => {
  it('creates a directed block and deletes by pair', async () => {
    const repo = new PrismaBlockRepository(db.prisma);
    const blocker = await createUser(db.prisma);
    const blocked = await createUser(db.prisma);

    const created = await repo.create({
      blocker: { connect: { id: blocker.id } },
      blocked: { connect: { id: blocked.id } },
    });
    expect(await repo.findByPair(blocker.id, blocked.id)).toMatchObject({ id: created.id });
    expect(await repo.exists(blocker.id, blocked.id)).toBe(true);

    const deleted = await repo.deleteByPair(blocker.id, blocked.id);
    expect(deleted?.id).toBe(created.id);
    expect(await repo.findByPair(blocker.id, blocked.id)).toBeNull();
  });
});

describe('ReportRepository', () => {
  it('creates reports and finds open duplicates by reporter+target', async () => {
    const repo = new PrismaReportRepository(db.prisma);
    const reporter = await createUser(db.prisma);
    const target = await createUser(db.prisma);

    const report = await repo.create({
      reporter: { connect: { id: reporter.id } },
      targetType: 'user',
      targetId: target.id,
      reason: 'spam',
      status: 'open',
    });

    expect(await repo.findById(report.id)).not.toBeNull();
    expect(await repo.findOpenByReporterAndTarget(reporter.id, 'user', target.id)).toMatchObject({
      id: report.id,
    });

    await repo.updateStatus(report.id, 'resolved');
    expect(await repo.findOpenByReporterAndTarget(reporter.id, 'user', target.id)).toBeNull();
  });
});

describe('ModerationCaseRepository', () => {
  it('creates a case linked to a report', async () => {
    const reports = new PrismaReportRepository(db.prisma);
    const cases = new PrismaModerationCaseRepository(db.prisma);
    const reporter = await createUser(db.prisma);
    const target = await createUser(db.prisma);

    const report = await reports.create({
      reporter: { connect: { id: reporter.id } },
      targetType: 'user',
      targetId: target.id,
      reason: 'harassment',
      status: 'open',
    });

    const moderationCase = await cases.create({
      report: { connect: { id: report.id } },
      subjectType: 'user',
      subjectId: target.id,
      status: 'open',
    });

    expect(await cases.findByReportId(report.id)).toMatchObject({ id: moderationCase.id });
  });
});

describe('AdminActionRepository', () => {
  it('records admin actions by subject and actor', async () => {
    const repo = new PrismaAdminActionRepository(db.prisma);
    const actor = await createUser(db.prisma);
    const subject = await createUser(db.prisma);

    const row = await repo.create({
      actor: { connect: { id: actor.id } },
      action: 'warn',
      subjectType: 'user',
      subjectId: subject.id,
      notes: 'note',
    });

    expect(await repo.findById(row.id)).not.toBeNull();
    expect((await repo.listBySubject('user', subject.id)).map((r) => r.id)).toEqual([row.id]);
    expect((await repo.listByActor(actor.id)).map((r) => r.id)).toEqual([row.id]);
  });
});

describe('NotificationRepository', () => {
  it('lists newest first, marks read without overwriting, and mark-all unread only', async () => {
    const repo = new PrismaNotificationRepository(db.prisma);
    const user = await createUser(db.prisma);
    const older = await repo.create({
      recipient: { connect: { id: user.id } },
      kind: 'follow',
      objectType: 'user',
      objectId: 'user-a',
    });
    await db.prisma.notification.update({
      where: { id: older.id },
      data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const newer = await repo.create({
      recipient: { connect: { id: user.id } },
      kind: 'follow',
      objectType: 'user',
      objectId: 'user-b',
    });
    await db.prisma.notification.update({
      where: { id: newer.id },
      data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
    });

    const listed = await repo.listByUser(user.id, { limit: 10 });
    expect(listed.map((n) => n.id)).toEqual([newer.id, older.id]);

    const firstRead = await repo.markRead(older.id);
    expect(firstRead?.readAt).toBeInstanceOf(Date);
    const preserved = firstRead!.readAt!;
    const secondRead = await repo.markRead(older.id);
    expect(secondRead?.readAt?.getTime()).toBe(preserved.getTime());

    await repo.markAllRead(user.id);
    const afterAll = await repo.listByUser(user.id, { limit: 10 });
    expect(afterAll.every((n) => n.readAt != null)).toBe(true);
  });

  it('deleteReadOlderThan removes read rows before cutoff and keeps unread and recent read', async () => {
    const repo = new PrismaNotificationRepository(db.prisma);
    const user = await createUser(db.prisma);
    const oldRead = await repo.create({
      recipient: { connect: { id: user.id } },
      kind: 'follow',
      objectType: 'user',
      objectId: 'user-old',
    });
    await db.prisma.notification.update({
      where: { id: oldRead.id },
      data: { readAt: new Date('2025-01-01T00:00:00.000Z') },
    });
    const recentRead = await repo.create({
      recipient: { connect: { id: user.id } },
      kind: 'follow',
      objectType: 'user',
      objectId: 'user-recent',
    });
    await db.prisma.notification.update({
      where: { id: recentRead.id },
      data: { readAt: new Date('2026-06-01T00:00:00.000Z') },
    });
    const unread = await repo.create({
      recipient: { connect: { id: user.id } },
      kind: 'follow',
      objectType: 'user',
      objectId: 'user-unread',
    });

    const deleted = await repo.deleteReadOlderThan(new Date('2026-01-01T00:00:00.000Z'));
    expect(deleted).toBe(1);

    const remaining = await repo.listByUser(user.id, { limit: 10 });
    expect(remaining.map((n) => n.id).sort()).toEqual([recentRead.id, unread.id].sort());
  });
});
