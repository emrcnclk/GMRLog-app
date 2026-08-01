import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import type { CommunitiesService } from '../communities/communities.service';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import {
  asSearchIndexPublisher,
  createFakeSearchIndexPublisher,
} from '../infrastructure/jobs/testing/fake-search-index.publisher';
import {
  createFakeFollowRepository,
  makeFollow,
  type FakeFollowRepository,
} from '../follows/testing/fake-repositories';

import {
  createFakeCommunityMemberRepository,
  createFakeCommunityRepository,
  makeCommunity,
  makeCommunityMember,
  type FakeCommunityMemberRepository,
  type FakeCommunityRepository,
} from '../communities/testing/fake-repositories';
import {
  createFakeNotificationRepository,
  type FakeNotificationRepository,
} from '../notifications/testing/fake-repositories';

import { PostsService } from './posts.service';
import {
  createFakeGameRepository,
  createFakePollRepository,
  createFakePollVoteRepository,
  createFakePostBookmarkRepository,
  createFakePostRepository,
  createFakeRepostRepository,
  createFakeUserRepository,
  makeGame,
  makePost,
  makeUser,
  type FakeGameRepository,
  type FakePollRepository,
  type FakePollVoteRepository,
  type FakePostBookmarkRepository,
  type FakePostRepository,
  type FakeRepostRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };
const other: RequestIdentity = { class: 'player', userId: 'user-2' };

let posts: FakePostRepository;
let games: FakeGameRepository;
let users: FakeUserRepository;
let follows: FakeFollowRepository;
let communities: FakeCommunityRepository;
let communityMembers: FakeCommunityMemberRepository;
let feedFanout: ReturnType<typeof createFakeFeedFanoutPublisher>;
let reposts: FakeRepostRepository;
let polls: FakePollRepository;
let pollVotes: FakePollVoteRepository;
let bookmarks: FakePostBookmarkRepository;
let notifications: FakeNotificationRepository;
let communityBadges: { syncBadgesForCommunity: ReturnType<typeof vi.fn> };
let service: PostsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  ]);
  games = createFakeGameRepository([
    makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
    makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
  ]);
  posts = createFakePostRepository();
  follows = createFakeFollowRepository();
  communities = createFakeCommunityRepository([
    makeCommunity({ id: 'community-1', slug: 'culture-room' }),
  ]);
  communityMembers = createFakeCommunityMemberRepository([
    makeCommunityMember({
      id: 'member-1',
      communityId: 'community-1',
      userId: 'user-1',
      role: 'owner',
    }),
  ]);
  feedFanout = createFakeFeedFanoutPublisher();
  reposts = createFakeRepostRepository();
  polls = createFakePollRepository();
  pollVotes = createFakePollVoteRepository();
  bookmarks = createFakePostBookmarkRepository();
  notifications = createFakeNotificationRepository();
  communityBadges = { syncBadgesForCommunity: vi.fn().mockResolvedValue(undefined) };
  service = new PostsService(
    posts,
    games,
    users,
    follows,
    communities,
    communityMembers,
    asFeedFanoutPublisher(feedFanout),
    asSearchIndexPublisher(createFakeSearchIndexPublisher()),
    reposts,
    polls,
    pollVotes,
    bookmarks,
    notifications,
    null,
    communityBadges as unknown as CommunitiesService,
  );
});

describe('PostsService.createPost', () => {
  it('creates a public post with optional game association', async () => {
    const created = await service.createPost('user-1', {
      body: 'Culture note',
      gameId: 'game-1',
    });
    expect(created).toMatchObject({
      body: 'Culture note',
      visibility: 'public',
      gameId: 'game-1',
      communityId: null,
      author: { id: 'user-1', handle: 'gamer' },
      game: { id: 'game-1', title: 'Hollow Knight' },
    });
  });

  it('associates an active community when the author is a member', async () => {
    const created = await service.createPost('user-1', {
      body: 'Room note',
      communityId: 'community-1',
    });
    expect(created.communityId).toBe('community-1');
  });

  it('publishes feed fan-out when post has communityId', async () => {
    await service.createPost('user-1', {
      body: 'Room note',
      communityId: 'community-1',
    });
    expect(feedFanout.publish).toHaveBeenCalledOnce();
    expect(feedFanout.calls[0]).toMatchObject({
      kind: 'post',
      actorId: 'user-1',
      communityId: 'community-1',
    });
  });

  it('recomputes community badges (top_contributor) after a community post', async () => {
    await service.createPost('user-1', {
      body: 'Room note',
      communityId: 'community-1',
    });
    expect(communityBadges.syncBadgesForCommunity).toHaveBeenCalledTimes(1);
    expect(communityBadges.syncBadgesForCommunity).toHaveBeenCalledWith('community-1');
  });

  it('does not recompute badges for posts without a community', async () => {
    await service.createPost('user-1', { body: 'Solo note' });
    expect(communityBadges.syncBadgesForCommunity).not.toHaveBeenCalled();
  });

  it('rejects unknown game, non-member community, and media uploads', async () => {
    await expect(
      service.createPost('user-1', { body: 'Nope', gameId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.createPost('user-2', { body: 'Nope', communityId: 'community-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.createPost('user-1', { body: 'Nope', communityId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.createPost('user-1', { body: 'Nope', mediaUploadIds: ['upload-1'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PostsService visibility + ownership', () => {
  it('lets guests read public posts and hides private from non-authors', async () => {
    const pub = await service.createPost('user-1', { body: 'Public', visibility: 'public' });
    const priv = await service.createPost('user-1', { body: 'Secret', visibility: 'private' });

    await expect(service.getPost(pub.id, guest)).resolves.toMatchObject({ id: pub.id });
    await expect(service.getPost(priv.id, guest)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getPost(priv.id, other)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getPost(priv.id, player)).resolves.toMatchObject({ id: priv.id });
  });

  it('filters game lists by visibility', async () => {
    await service.createPost('user-1', {
      body: 'Public',
      gameId: 'game-1',
      visibility: 'public',
    });
    await service.createPost('user-1', {
      body: 'Private',
      gameId: 'game-1',
      visibility: 'private',
    });

    expect(await service.listGamePosts('game-1', guest)).toHaveLength(1);
    expect(await service.listGamePosts('game-1', player)).toHaveLength(2);
  });

  it('resolves followers visibility for followers only', async () => {
    const created = await service.createPost('user-1', {
      body: 'Circle',
      visibility: 'followers',
    });
    await expect(service.getPost(created.id, other)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getPost(created.id, guest)).rejects.toBeInstanceOf(NotFoundException);

    follows.rows.set(
      'edge',
      makeFollow({ id: 'edge', followerId: 'user-2', followeeId: 'user-1' }),
    );
    await expect(service.getPost(created.id, other)).resolves.toMatchObject({
      visibility: 'followers',
    });
  });

  it('allows author update/delete and forbids others', async () => {
    const created = await service.createPost('user-1', { body: 'Draft' });
    const updated = await service.updatePost(created.id, 'user-1', {
      body: 'Edited',
      visibility: 'followers',
    });
    expect(updated).toMatchObject({ body: 'Edited', visibility: 'followers' });

    await expect(service.updatePost(created.id, 'user-2', { body: 'Hack' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    await expect(service.deletePost(created.id, 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await service.deletePost(created.id, 'user-1');
    expect(await posts.findActiveById(created.id)).toBeNull();
  });

  it('clears gameId on patch and excludes soft-deleted from lists', async () => {
    const created = await service.createPost('user-1', {
      body: 'Linked',
      gameId: 'game-1',
    });
    const cleared = await service.updatePost(created.id, 'user-1', { gameId: null });
    expect(cleared.gameId).toBeNull();

    posts.rows.set(
      'gone',
      makePost({ id: 'gone', gameId: 'game-1', body: 'Gone', deletedAt: new Date() }),
    );
    const listed = await service.listGamePosts('game-1', player);
    expect(listed.map((p) => p.id)).not.toContain('gone');
  });

  it('returns early on empty game lists and supports no-op updates', async () => {
    expect(await service.listGamePosts('game-2', guest)).toEqual([]);

    const created = await service.createPost('user-1', { body: 'Stable' });
    const unchanged = await service.updatePost(created.id, 'user-1', {});
    expect(unchanged.body).toBe('Stable');

    const withCommunity = await service.updatePost(created.id, 'user-1', {
      communityId: 'community-1',
    });
    expect(withCommunity.communityId).toBe('community-1');

    const clearedCommunity = await service.updatePost(created.id, 'user-1', {
      communityId: null,
    });
    expect(clearedCommunity.communityId).toBeNull();
  });
});

describe('PostsService.createPost — D3.24 poll attach', () => {
  it('creates a poll row when postKind is poll', async () => {
    const created = await service.createPost('user-1', {
      body: 'Which game wins?',
      postKind: 'poll',
      poll: { question: 'Which game wins?', options: ['A', 'B'] },
    });
    expect(created.postKind).toBe('poll');
    const poll = await polls.findByPostId(created.id);
    expect(poll).toMatchObject({ question: 'Which game wins?', options: ['A', 'B'] });
  });

  it('rejects poll postKind without a poll payload', async () => {
    await expect(
      service.createPost('user-1', { body: 'No poll', postKind: 'poll' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists containsSpoilers flag', async () => {
    const created = await service.createPost('user-1', {
      body: 'Ending spoiled',
      containsSpoilers: true,
    });
    expect(created.containsSpoilers).toBe(true);
  });
});

describe('PostsService.repostPost / undoRepost', () => {
  it('reposts a post and notifies the original author once', async () => {
    const original = await service.createPost('user-1', { body: 'Original' });
    const repost = await service.repostPost('user-2', original.id);
    expect(repost).toMatchObject({ originalPostId: original.id, actor: { id: 'user-2' } });
    expect([...notifications.rows.values()]).toHaveLength(1);
  });

  it('is idempotent per (actor, post)', async () => {
    const original = await service.createPost('user-1', { body: 'Original' });
    await service.repostPost('user-2', original.id);
    await expect(service.repostPost('user-2', original.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('never notifies the actor about their own repost', async () => {
    const original = await service.createPost('user-1', { body: 'Original' });
    await service.repostPost('user-1', original.id);
    expect(notifications.rows.size).toBe(0);
  });

  it('undoes a repost and allows re-repost after', async () => {
    const original = await service.createPost('user-1', { body: 'Original' });
    await service.repostPost('user-2', original.id);
    await service.undoRepost('user-2', original.id);
    await expect(service.undoRepost('user-2', original.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.repostPost('user-2', original.id)).resolves.toMatchObject({
      originalPostId: original.id,
    });
  });
});

describe('PostsService.pinPost / unpinPost', () => {
  it('pins a post and unpins the previously pinned one', async () => {
    const first = await service.createPost('user-1', { body: 'First' });
    const second = await service.createPost('user-1', { body: 'Second' });

    const pinnedFirst = await service.pinPost('user-1', first.id);
    expect(pinnedFirst.pinnedAt).not.toBeNull();

    const pinnedSecond = await service.pinPost('user-1', second.id);
    expect(pinnedSecond.pinnedAt).not.toBeNull();

    const refreshedFirst = await posts.findActiveById(first.id);
    expect(refreshedFirst?.pinnedAt).toBeNull();
  });

  it('forbids pinning another author’s post', async () => {
    const post = await service.createPost('user-1', { body: 'Mine' });
    await expect(service.pinPost('user-2', post.id)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('unpins a post', async () => {
    const post = await service.createPost('user-1', { body: 'Mine' });
    await service.pinPost('user-1', post.id);
    const unpinned = await service.unpinPost('user-1', post.id);
    expect(unpinned.pinnedAt).toBeNull();
  });
});

describe('PostsService.bookmarkPost / unbookmarkPost / listBookmarks', () => {
  it('bookmarks a post and is idempotent on repeat calls', async () => {
    const post = await service.createPost('user-1', { body: 'Save me' });
    const first = await service.bookmarkPost('user-2', post.id);
    expect(first).toMatchObject({ postId: post.id });

    const second = await service.bookmarkPost('user-2', post.id);
    expect(second.id).toBe(first.id);
    expect(bookmarks.rows.size).toBe(1);
  });

  it('never creates a notification for the author', async () => {
    const post = await service.createPost('user-1', { body: 'Quiet save' });
    await service.bookmarkPost('user-2', post.id);
    expect(notifications.rows.size).toBe(0);
  });

  it('rejects bookmarking a post the viewer cannot read', async () => {
    const priv = await service.createPost('user-1', { body: 'Secret', visibility: 'private' });
    await expect(service.bookmarkPost('user-2', priv.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('unbookmarks a post and rejects unbookmarking twice', async () => {
    const post = await service.createPost('user-1', { body: 'Save me' });
    await service.bookmarkPost('user-2', post.id);
    await service.unbookmarkPost('user-2', post.id);
    await expect(service.unbookmarkPost('user-2', post.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists bookmarks newest-first with cursor pagination', async () => {
    const first = await service.createPost('user-1', { body: 'One' });
    const second = await service.createPost('user-1', { body: 'Two' });
    const third = await service.createPost('user-1', { body: 'Three' });
    await service.bookmarkPost('user-2', first.id);
    await service.bookmarkPost('user-2', second.id);
    await service.bookmarkPost('user-2', third.id);

    const page1 = await service.listBookmarks('user-2', { limit: 2 });
    expect(page1.items.map((b) => b.postId)).toEqual([third.id, second.id]);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).not.toBeNull();

    const page2 = await service.listBookmarks('user-2', {
      limit: 2,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items.map((b) => b.postId)).toEqual([first.id]);
    expect(page2.hasMore).toBe(false);
  });

  it('rejects an invalid bookmarks cursor', async () => {
    await expect(
      service.listBookmarks('user-2', { cursor: 'not-base64url-payload' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PostsService.votePoll', () => {
  it('votes and returns aggregated results with the viewer vote index', async () => {
    const created = await service.createPost('user-1', {
      body: 'Which game wins?',
      postKind: 'poll',
      poll: { question: 'Which game wins?', options: ['A', 'B'] },
    });

    const result = await service.votePoll('user-2', created.id, 1);
    expect(result).toMatchObject({
      question: 'Which game wins?',
      viewerVoteIndex: 1,
      totalVotes: 1,
      options: [
        { index: 0, label: 'A', voteCount: 0 },
        { index: 1, label: 'B', voteCount: 1 },
      ],
    });
  });

  it('aggregates poll results onto GET /posts/{id}', async () => {
    const created = await service.createPost('user-1', {
      body: 'Which game wins?',
      postKind: 'poll',
      poll: { question: 'Which game wins?', options: ['A', 'B'] },
    });
    await service.votePoll('user-2', created.id, 0);

    const fetched = await service.getPost(created.id, player);
    expect(fetched.poll).toMatchObject({
      totalVotes: 1,
      viewerVoteIndex: null,
      options: [
        { index: 0, label: 'A', voteCount: 1 },
        { index: 1, label: 'B', voteCount: 0 },
      ],
    });

    const fetchedByVoter = await service.getPost(created.id, other);
    expect(fetchedByVoter.poll?.viewerVoteIndex).toBe(0);
  });

  it('rejects a second vote from the same user', async () => {
    const created = await service.createPost('user-1', {
      body: 'Poll',
      postKind: 'poll',
      poll: { question: 'Q', options: ['A', 'B'] },
    });
    await service.votePoll('user-2', created.id, 0);
    await expect(service.votePoll('user-2', created.id, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an out-of-range option index', async () => {
    const created = await service.createPost('user-1', {
      body: 'Poll',
      postKind: 'poll',
      poll: { question: 'Q', options: ['A', 'B'] },
    });
    await expect(service.votePoll('user-2', created.id, 5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects votes once the poll has closed', async () => {
    const created = await service.createPost('user-1', {
      body: 'Poll',
      postKind: 'poll',
      poll: {
        question: 'Q',
        options: ['A', 'B'],
        endsAt: new Date(Date.now() - 1000).toISOString(),
      },
    });
    await expect(service.votePoll('user-2', created.id, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('404s voting on a post without a poll', async () => {
    const created = await service.createPost('user-1', { body: 'No poll here' });
    await expect(service.votePoll('user-2', created.id, 0)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('PostsService.bookmarkPost / unbookmarkPost / listBookmarks', () => {
  it('bookmarks a post privately and is idempotent', async () => {
    const post = await service.createPost('user-1', { body: 'Save me' });
    const first = await service.bookmarkPost('user-2', post.id);
    const second = await service.bookmarkPost('user-2', post.id);
    expect(first.id).toBe(second.id);
    expect(notifications.rows.size).toBe(0);
  });

  it('lists a user’s bookmarks newest first', async () => {
    const a = await service.createPost('user-1', { body: 'A' });
    const b = await service.createPost('user-1', { body: 'B' });
    await service.bookmarkPost('user-2', a.id);
    await service.bookmarkPost('user-2', b.id);
    const page = await service.listBookmarks('user-2');
    expect(page.items.map((row) => row.postId)).toEqual([b.id, a.id]);
  });

  it('unbookmarks a post', async () => {
    const post = await service.createPost('user-1', { body: 'Save me' });
    await service.bookmarkPost('user-2', post.id);
    await service.unbookmarkPost('user-2', post.id);
    await expect(service.unbookmarkPost('user-2', post.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('PostsService.votePoll', () => {
  it('votes once per user and aggregates totals', async () => {
    const post = await service.createPost('user-1', {
      body: 'Pick one',
      postKind: 'poll',
      poll: { question: 'Pick one', options: ['A', 'B'] },
    });
    const result = await service.votePoll('user-2', post.id, 1);
    expect(result.totalVotes).toBe(1);
    expect(result.options.map((option) => option.voteCount)).toEqual([0, 1]);
    expect(result.viewerVoteIndex).toBe(1);
    await expect(service.votePoll('user-2', post.id, 0)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an out-of-range option', async () => {
    const post = await service.createPost('user-1', {
      body: 'Pick one',
      postKind: 'poll',
      poll: { question: 'Pick one', options: ['A', 'B'] },
    });
    await expect(service.votePoll('user-2', post.id, 5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects votes after the poll has ended', async () => {
    const post = await service.createPost('user-1', {
      body: 'Pick one',
      postKind: 'poll',
      poll: {
        question: 'Pick one',
        options: ['A', 'B'],
        endsAt: new Date(Date.now() - 1000).toISOString(),
      },
    });
    await expect(service.votePoll('user-2', post.id, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('includes poll results when projecting a poll post', async () => {
    const post = await service.createPost('user-1', {
      body: 'Pick one',
      postKind: 'poll',
      poll: { question: 'Pick one', options: ['A', 'B'] },
    });
    await service.votePoll('user-2', post.id, 0);
    const fetched = await service.getPost(post.id, other);
    expect(fetched.poll).toMatchObject({ totalVotes: 1, viewerVoteIndex: 0 });
  });

  it('closes a poll early and rejects further votes', async () => {
    const post = await service.createPost('user-1', {
      body: 'Closing soon',
      postKind: 'poll',
      poll: { question: 'Close me?', options: ['Yes', 'No'] },
    });
    const closed = await service.closePoll('user-1', post.id);
    expect(closed.endsAt).not.toBeNull();
    await expect(service.votePoll('user-2', post.id, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const again = await service.closePoll('user-1', post.id);
    expect(again.endsAt).toBe(closed.endsAt);
  });

  it('returns aggregated poll via getPoll', async () => {
    const post = await service.createPost('user-1', {
      body: 'Agg',
      postKind: 'poll',
      poll: { question: 'Agg?', options: ['A', 'B'] },
    });
    await service.votePoll('user-2', post.id, 1);
    const poll = await service.getPoll('user-2', post.id);
    expect(poll).toMatchObject({ totalVotes: 1, viewerVoteIndex: 1 });
  });
});
