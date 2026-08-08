import type {
  ActivityKind,
  Community,
  CommunityActivityRepository,
  CommunityListCursor,
  CommunityMember,
  CommunityMemberBadgeRepository,
  CommunityMemberRepository,
  CommunityPinRepository,
  CommunityRepository,
  CommunityWikiRepository,
  FollowRepository,
  NotificationRepository,
  PostRepository,
  Prisma,
  User,
  UserRepository,
} from '@gmrlog/database';
import type {
  ActivityItemResponse,
  CommunityMemberBadgeResponse,
  CommunityMemberResponse,
  CommunityPinResponse,
  CommunityResponse,
  CommunityWikiPageResponse,
  FeedItemResponse,
} from '@gmrlog/types';
import type {
  ActivityQueryInput,
  CommunityCreateInput,
  CommunityFeedQueryInput,
  CommunityListQueryInput,
  CommunityMemberRolePatchInput,
  CommunityPatchInput,
  CommunityPinCreateInput,
  CommunityWikiUpsertInput,
} from '@gmrlog/validators';
import {
  ACTIVITY_LIST_DEFAULT_LIMIT,
  COMMUNITY_LIST_DEFAULT_LIMIT,
  COMMUNITY_PIN_CAP,
} from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { toActivityItemResponse } from '../activity/mappers/activity.mapper';
import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { FeedCacheService } from '../infrastructure/redis/feed-cache.service';

import {
  COMMUNITY_ACTIVITY_REPOSITORY,
  COMMUNITY_BADGE_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_NOTIFICATION_REPOSITORY,
  COMMUNITY_PIN_REPOSITORY,
  COMMUNITY_POST_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_USER_REPOSITORY,
  COMMUNITY_WIKI_REPOSITORY,
} from './communities.tokens';
import { syncCommunityBadges, syncMemberRoleBadges } from './community-badges';
import {
  canAdministerCommunity,
  canChangeMemberRoles,
  canDeleteCommunity,
  canEditWiki,
  canManagePins,
} from './community-permissions';
import {
  canViewerReadCommunity,
  toCommunityFeedItemResponse,
  toCommunityMemberBadgeResponse,
  toCommunityMemberResponse,
  toCommunityMembershipSummary,
  toCommunityPinResponse,
  toCommunityResponse,
  toCommunityWikiPageResponse,
} from './mappers/community.mapper';

/**
 * Community domain service (F6.3 / D2.12 · S1.1 · D3.24 Communities 2.0).
 * CRUD · detail · members · membership · feed · activity · wiki · pins · badges.
 * Wiki edit does not emit `community_milestone` (matrix: milestone reach only).
 */
@Injectable()
export class CommunitiesService {
  constructor(
    @Inject(COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY) private readonly members: CommunityMemberRepository,
    @Inject(COMMUNITY_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(COMMUNITY_ACTIVITY_REPOSITORY)
    private readonly communityActivities: CommunityActivityRepository,
    @Inject(COMMUNITY_WIKI_REPOSITORY) private readonly wiki: CommunityWikiRepository,
    @Inject(COMMUNITY_PIN_REPOSITORY) private readonly pins: CommunityPinRepository,
    @Inject(COMMUNITY_BADGE_REPOSITORY) private readonly badges: CommunityMemberBadgeRepository,
    @Inject(COMMUNITY_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(COMMUNITY_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Optional() private readonly feedCache: FeedCacheService | null = null,
  ) {}

  /**
   * S1 §5 cursor pagination + a batched projection.
   *
   * This used to return every discoverable community and project each one with
   * its own queries — a member count, a viewer-membership lookup and, through
   * `isReadable`, a full member list to find the owner. Measured at 111,603 ms
   * over 100,009 rows, past the client's 30s timeout, so the directory never
   * loaded at all. A page is now bounded and costs a fixed number of queries
   * regardless of its size.
   */
  async listCommunities(
    identity: RequestIdentity,
    query: CommunityListQueryInput = {},
  ): Promise<PaginatedPayload<CommunityResponse>> {
    const viewerId = viewerIdOf(identity);
    const limit = query.limit ?? COMMUNITY_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCommunityCursor(query.cursor) : undefined;
    const options = { limit: limit + 1, ...(cursor !== undefined ? { cursor } : {}) };

    const rows =
      viewerId === null
        ? await this.communities.listPublic(options)
        : await this.communities.listDiscoverableForMemberCommunityIds(
            await this.members.listCommunityIdsByUser(viewerId),
            options,
          );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCommunityCursor({ updatedAt: last.updatedAt, id: last.id })
        : null;

    const projected = await this.projectPage(page, viewerId);
    return new PaginatedPayload(projected, { next }, hasMore, limit);
  }

  async getCommunity(communityId: string, identity: RequestIdentity): Promise<CommunityResponse> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    return this.project(community, viewerIdOf(identity));
  }

  async createCommunity(actorId: string, input: CommunityCreateInput): Promise<CommunityResponse> {
    await this.requireActiveUser(actorId);

    const existingSlug = await this.communities.findBySlug(input.slug);
    if (existingSlug != null && existingSlug.deletedAt == null) {
      throw new ConflictException('Community slug is already in use');
    }

    const community = await this.communities.create({
      name: input.name,
      slug: input.slug,
      visibility: input.visibility,
      ...(input.description !== undefined ? { description: input.description } : {}),
    });

    const membership = await this.members.create({
      community: { connect: { id: community.id } },
      user: { connect: { id: actorId } },
      role: 'owner',
    });

    const owner = await this.requireActiveUser(actorId);
    await syncMemberRoleBadges(this.badges, membership, owner);

    return this.project(community, actorId);
  }

  async updateCommunity(
    communityId: string,
    actorId: string,
    input: CommunityPatchInput,
  ): Promise<CommunityResponse> {
    const community = await this.requireActiveCommunity(communityId);
    const membership = await this.requireMembership(communityId, actorId);

    if (input.joinType !== undefined) {
      if (!canAdministerCommunity(membership.role)) {
        throw new ForbiddenException('Only community admins may change join type');
      }
    }

    const touchesSettings =
      input.name !== undefined || input.description !== undefined || input.visibility !== undefined;
    if (touchesSettings && !canAdministerCommunity(membership.role)) {
      throw new ForbiddenException('Only community admins may modify this community');
    }
    if (!touchesSettings && input.joinType === undefined) {
      throw new BadRequestException('No community fields to update');
    }

    const data: Prisma.CommunityUpdateInput = {};
    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }
    if (input.joinType !== undefined) {
      data.joinType = input.joinType;
    }

    const updated = await this.communities.update(community.id, data);
    return this.project(updated, actorId);
  }

  async deleteCommunity(communityId: string, actorId: string): Promise<void> {
    await this.requireActiveCommunity(communityId);
    const membership = await this.requireMembership(communityId, actorId);
    if (!canDeleteCommunity(membership.role)) {
      throw new ForbiddenException('Only the community owner may delete this community');
    }
    await this.communities.softDelete(communityId);
  }

  async listMembers(
    communityId: string,
    identity: RequestIdentity,
  ): Promise<CommunityMemberResponse[]> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    return this.projectMembers(community.id);
  }

  async listBadges(
    communityId: string,
    identity: RequestIdentity,
  ): Promise<CommunityMemberBadgeResponse[]> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    const rows = await this.badges.listByCommunity(communityId);
    return rows.map(toCommunityMemberBadgeResponse);
  }

  async updateMemberRole(
    communityId: string,
    actorId: string,
    targetUserId: string,
    input: CommunityMemberRolePatchInput,
  ): Promise<CommunityMemberResponse> {
    await this.requireActiveCommunity(communityId);
    const actorMembership = await this.requireMembership(communityId, actorId);
    if (!canChangeMemberRoles(actorMembership.role)) {
      throw new ForbiddenException('Only community admins may change member roles');
    }

    const target = await this.members.findByCommunityAndUser(communityId, targetUserId);
    if (!target) {
      throw new NotFoundException('Community membership not found');
    }
    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot change the community owner role');
    }
    if (target.userId === actorId && actorMembership.role !== 'owner') {
      throw new ForbiddenException('Cannot change your own role');
    }

    const updated = await this.members.update(target.id, { role: input.role });
    const user = await this.requireActiveUser(targetUserId);
    const previousBadgeKinds = new Set(
      (await this.badges.listByMember(updated.id)).map((row) => row.kind),
    );
    await syncMemberRoleBadges(this.badges, updated, user);
    await this.syncBadgesForCommunity(communityId);
    await this.notifyNewBadges(updated, previousBadgeKinds);

    await this.notifications.create({
      recipient: { connect: { id: targetUserId } },
      kind: 'community_role',
      objectType: 'community',
      objectId: communityId,
    });

    const badgeRows = await this.badges.listByMember(updated.id);
    return toCommunityMemberResponse(updated, user, badgeRows);
  }

  async listFeed(
    communityId: string,
    identity: RequestIdentity,
    query: CommunityFeedQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);

    if (query.tab === 'pinned') {
      return new PaginatedPayload(
        [],
        { next: null },
        false,
        query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT,
      );
    }

    const viewerId = viewerIdOf(identity) ?? 'anon';
    const tab = query.tab ?? 'all';
    const cacheKey =
      this.feedCache !== null
        ? `${this.feedCache.communityKey(communityId, viewerId, query.cursor)}:${tab}`
        : null;
    if (cacheKey !== null && this.feedCache !== null) {
      const cached = await this.feedCache.getPage<FeedItemResponse>(cacheKey);
      if (cached !== null) {
        return new PaginatedPayload(cached.items, cached.cursor, cached.hasMore, cached.limit);
      }
    }

    const kinds = feedTabToActivityKinds(query.tab);
    const page = await this.paginateCommunityActivity(
      communityId,
      query,
      toCommunityFeedItemResponse,
      kinds,
    );

    if (cacheKey !== null && this.feedCache !== null) {
      await this.feedCache.setPage(
        cacheKey,
        {
          items: page.items,
          cursor: page.cursor,
          hasMore: page.hasMore,
          limit: page.limit,
        },
        this.feedCache.communityIndexKey(communityId),
      );
    }

    return page;
  }

  async listActivity(
    communityId: string,
    identity: RequestIdentity,
    query: ActivityQueryInput = {},
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    return this.paginateCommunityActivity(communityId, query, (row) => toActivityItemResponse(row));
  }

  async joinCommunity(communityId: string, actorId: string): Promise<void> {
    const community = await this.requireActiveCommunity(communityId);
    await this.requireActiveUser(actorId);
    this.assertJoinAllowed(community);

    const existing = await this.members.findByCommunityAndUser(communityId, actorId);
    if (existing) {
      throw new ConflictException('Already a member of this community');
    }

    const membership = await this.members.create({
      community: { connect: { id: communityId } },
      user: { connect: { id: actorId } },
      role: 'member',
    });

    const user = await this.requireActiveUser(actorId);
    await syncMemberRoleBadges(this.badges, membership, user);
  }

  async leaveCommunity(communityId: string, actorId: string): Promise<void> {
    await this.requireActiveCommunity(communityId);
    const membership = await this.members.findByCommunityAndUser(communityId, actorId);
    if (!membership) {
      throw new NotFoundException('Community membership not found');
    }
    if (membership.role === 'owner') {
      throw new ConflictException('Community owner cannot leave; delete the community instead');
    }
    await this.members.deleteByCommunityAndUser(communityId, actorId);
  }

  async listWikiPages(
    communityId: string,
    identity: RequestIdentity,
  ): Promise<CommunityWikiPageResponse[]> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    const pages = await this.wiki.listByCommunity(communityId);
    return this.projectWikiPages(pages);
  }

  async getWikiPage(
    communityId: string,
    slug: string,
    identity: RequestIdentity,
  ): Promise<CommunityWikiPageResponse> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    const page = await this.wiki.findBySlug(communityId, slug);
    if (!page) {
      throw new NotFoundException('Wiki page not found');
    }
    const editor = await this.requireActiveUser(page.updatedById);
    return toCommunityWikiPageResponse(page, editor);
  }

  async upsertWikiPage(
    communityId: string,
    slug: string,
    actorId: string,
    input: CommunityWikiUpsertInput,
  ): Promise<CommunityWikiPageResponse> {
    await this.requireActiveCommunity(communityId);
    const membership = await this.requireMembership(communityId, actorId);
    if (!canEditWiki(membership.role)) {
      throw new ForbiddenException('Only moderators may edit community wiki pages');
    }
    await this.requireActiveUser(actorId);

    const existing = await this.wiki.findBySlug(communityId, slug);
    let page;
    if (existing == null) {
      page = await this.wiki.create({
        community: { connect: { id: communityId } },
        slug,
        title: input.title,
        body: input.body,
        updatedBy: { connect: { id: actorId } },
        version: 1,
      });
    } else {
      page = await this.wiki.update(existing.id, {
        title: input.title,
        body: input.body,
        updatedBy: { connect: { id: actorId } },
        version: { increment: 1 },
      });
    }

    await this.syncBadgesForCommunity(communityId);
    const ownerUserId = await this.findOwnerUserId(communityId);
    if (ownerUserId !== null && ownerUserId !== actorId) {
      await this.notifications.create({
        recipient: { connect: { id: ownerUserId } },
        kind: 'community_wiki',
        objectType: 'community',
        objectId: communityId,
      });
    }
    const editor = await this.requireActiveUser(actorId);
    return toCommunityWikiPageResponse(page, editor);
  }

  async listPins(communityId: string, identity: RequestIdentity): Promise<CommunityPinResponse[]> {
    const community = await this.requireActiveCommunity(communityId);
    await this.assertReadable(community, identity);
    const rows = await this.pins.listByCommunity(communityId);
    return rows.map(toCommunityPinResponse);
  }

  async createPin(
    communityId: string,
    actorId: string,
    input: CommunityPinCreateInput,
  ): Promise<CommunityPinResponse> {
    await this.requireActiveCommunity(communityId);
    const membership = await this.requireMembership(communityId, actorId);
    if (!canManagePins(membership.role)) {
      throw new ForbiddenException('Only moderators may pin community objects');
    }

    const existing = await this.pins.findByObject(communityId, input.objectType, input.objectId);
    if (existing) {
      throw new ConflictException('Object is already pinned in this community');
    }

    const count = await this.pins.countByCommunity(communityId);
    if (count >= COMMUNITY_PIN_CAP) {
      throw new ConflictException(`Community pin limit of ${String(COMMUNITY_PIN_CAP)} reached`);
    }

    const created = await this.pins.create({
      community: { connect: { id: communityId } },
      objectType: input.objectType,
      objectId: input.objectId,
      position: count,
    });

    const ownerId = await this.resolvePinnedObjectOwner(input.objectType, input.objectId);
    if (ownerId !== null && ownerId !== actorId) {
      await this.notifications.create({
        recipient: { connect: { id: ownerId } },
        kind: 'post_pinned',
        objectType: input.objectType === 'post' ? 'post' : 'community',
        objectId: input.objectType === 'post' ? input.objectId : communityId,
      });
    }

    return toCommunityPinResponse(created);
  }

  async deletePin(communityId: string, pinId: string, actorId: string): Promise<void> {
    await this.requireActiveCommunity(communityId);
    const membership = await this.requireMembership(communityId, actorId);
    if (!canManagePins(membership.role)) {
      throw new ForbiddenException('Only moderators may remove community pins');
    }

    const pin = await this.pins.findById(pinId);
    if (pin?.communityId !== communityId) {
      throw new NotFoundException('Community pin not found');
    }
    await this.pins.delete(pinId);
  }

  /** Periodic / on-demand badge recompute (join · role · wiki · helpers). */
  async syncBadgesForCommunity(communityId: string): Promise<void> {
    const members = await this.members.listByCommunity(communityId);
    if (members.length === 0) {
      return;
    }
    const loaded = await this.users.findManyByIds(members.map((row) => row.userId));
    const usersById = new Map(loaded.map((user) => [user.id, user]));
    await syncCommunityBadges({
      communityId,
      members,
      usersById,
      badges: this.badges,
      posts: this.posts,
      wiki: this.wiki,
    });
  }

  private assertJoinAllowed(community: Community): void {
    if (community.joinType === 'public') {
      return;
    }
    if (community.joinType === 'private') {
      throw new ForbiddenException('This community requires approval to join');
    }
    throw new ForbiddenException('This community is invite-only');
  }

  private async project(community: Community, viewerId: string | null): Promise<CommunityResponse> {
    const memberCount = await this.members.countByCommunity(community.id);
    let viewerMembership = null;
    if (viewerId !== null) {
      const membership = await this.members.findByCommunityAndUser(community.id, viewerId);
      if (membership) {
        viewerMembership = toCommunityMembershipSummary(membership);
      }
    }
    return toCommunityResponse(community, memberCount, viewerMembership);
  }

  /**
   * Projects a page with a fixed query budget: one owner lookup, one count
   * `groupBy`, one viewer-membership query for the whole page — plus, only for
   * a `followers`-visibility row the viewer has not joined, a follow check.
   * That last case cannot arise from the directory list (it returns public
   * rows plus the viewer's own), and where it could it is bounded by the page.
   *
   * The readability filter runs on the batched data rather than re-querying,
   * which is what `filterReadable` used to do once per row.
   */
  private async projectPage(
    rows: Community[],
    viewerId: string | null,
  ): Promise<CommunityResponse[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const [owners, counts, memberships] = await Promise.all([
      this.members.listOwnersByCommunityIds(ids),
      this.members.countByCommunityIds(ids),
      viewerId === null
        ? Promise.resolve<CommunityMember[]>([])
        : this.members.listByCommunityIdsAndUser(ids, viewerId),
    ]);

    const ownerByCommunity = new Map(owners.map((row) => [row.communityId, row.userId]));
    const membershipByCommunity = new Map(memberships.map((row) => [row.communityId, row]));

    const projected: CommunityResponse[] = [];
    for (const row of rows) {
      const ownerUserId = ownerByCommunity.get(row.id);
      if (ownerUserId === undefined) {
        // An owner-less community is unreachable, exactly as `isReadable` says.
        continue;
      }
      const membership = membershipByCommunity.get(row.id) ?? null;
      let viewerFollowsOwner = false;
      if (
        row.visibility === 'followers' &&
        viewerId != null &&
        viewerId !== ownerUserId &&
        membership === null
      ) {
        viewerFollowsOwner = await this.follows.exists(viewerId, ownerUserId);
      }
      if (
        !canViewerReadCommunity(
          row.visibility,
          ownerUserId,
          viewerId,
          membership !== null,
          viewerFollowsOwner,
        )
      ) {
        continue;
      }
      projected.push(
        toCommunityResponse(
          row,
          counts.get(row.id) ?? 0,
          membership === null ? null : toCommunityMembershipSummary(membership),
        ),
      );
    }
    return projected;
  }

  private async projectMembers(communityId: string): Promise<CommunityMemberResponse[]> {
    const rows = await this.members.listByCommunity(communityId);
    if (rows.length === 0) {
      return [];
    }
    const loaded = await this.users.findManyByIds(rows.map((row) => row.userId));
    const byId = new Map(loaded.map((user) => [user.id, user]));
    const badgeRows = await this.badges.listByCommunity(communityId);
    const badgesByMember = new Map<string, typeof badgeRows>();
    for (const badge of badgeRows) {
      const list = badgesByMember.get(badge.memberId) ?? [];
      list.push(badge);
      badgesByMember.set(badge.memberId, list);
    }
    return rows.flatMap((row) => {
      const user = byId.get(row.userId);
      if (user == null || user.deletedAt != null) {
        return [];
      }
      return [toCommunityMemberResponse(row, user, badgesByMember.get(row.id) ?? [])];
    });
  }

  private async projectWikiPages(
    pages: Awaited<ReturnType<CommunityWikiRepository['listByCommunity']>>,
  ): Promise<CommunityWikiPageResponse[]> {
    if (pages.length === 0) {
      return [];
    }
    const loaded = await this.users.findManyByIds(pages.map((page) => page.updatedById));
    const byId = new Map(loaded.map((user) => [user.id, user]));
    return pages.flatMap((page) => {
      const editor = byId.get(page.updatedById);
      if (editor == null || editor.deletedAt != null) {
        return [];
      }
      return [toCommunityWikiPageResponse(page, editor)];
    });
  }

  private async assertReadable(community: Community, identity: RequestIdentity): Promise<void> {
    if (!(await this.isReadable(community, viewerIdOf(identity)))) {
      throw new NotFoundException('Community not found');
    }
  }

  private async isReadable(community: Community, viewerId: string | null): Promise<boolean> {
    const membership =
      viewerId === null ? null : await this.members.findByCommunityAndUser(community.id, viewerId);
    const ownerUserId = await this.findOwnerUserId(community.id);
    if (ownerUserId === null) {
      return false;
    }
    let viewerFollowsOwner = false;
    if (
      community.visibility === 'followers' &&
      viewerId != null &&
      viewerId !== ownerUserId &&
      membership == null
    ) {
      viewerFollowsOwner = await this.follows.exists(viewerId, ownerUserId);
    }
    return canViewerReadCommunity(
      community.visibility,
      ownerUserId,
      viewerId,
      membership != null,
      viewerFollowsOwner,
    );
  }

  private async findOwnerUserId(communityId: string): Promise<string | null> {
    const rows = await this.members.listByCommunity(communityId);
    const owner = rows.find((row) => row.role === 'owner');
    return owner?.userId ?? null;
  }

  private async requireMembership(communityId: string, userId: string): Promise<CommunityMember> {
    const membership = await this.members.findByCommunityAndUser(communityId, userId);
    if (!membership) {
      throw new ForbiddenException('Community membership required');
    }
    return membership;
  }

  private async requireActiveCommunity(communityId: string): Promise<Community> {
    const community = await this.communities.findActiveById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async resolvePinnedObjectOwner(
    objectType: string,
    objectId: string,
  ): Promise<string | null> {
    if (objectType !== 'post') {
      return null;
    }
    if (typeof this.posts.findActiveById !== 'function') {
      return null;
    }
    const post = await this.posts.findActiveById(objectId);
    return post?.authorId ?? null;
  }

  private async notifyNewBadges(
    member: CommunityMember,
    previousKinds: ReadonlySet<string>,
  ): Promise<void> {
    const current = await this.badges.listByMember(member.id);
    for (const badge of current) {
      if (previousKinds.has(badge.kind)) {
        continue;
      }
      await this.notifications.create({
        recipient: { connect: { id: member.userId } },
        kind: 'community_badge',
        objectType: 'community',
        objectId: member.communityId,
      });
    }
  }

  private async paginateCommunityActivity<T>(
    communityId: string,
    query: ActivityQueryInput,
    mapRow: (row: Awaited<ReturnType<CommunityActivityRepository['listByCommunity']>>[number]) => T,
    kinds?: readonly ActivityKind[],
  ): Promise<PaginatedPayload<T>> {
    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;
    const cursor = query.cursor !== undefined ? decodeActivityCursor(query.cursor) : undefined;

    const rows = await this.communityActivities.listByCommunity(communityId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(kinds !== undefined ? { kinds } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeActivityCursor({
            occurredAt: last.activityItem.occurredAt,
            id: last.activityItem.id,
          })
        : null;

    return new PaginatedPayload(page.map(mapRow), { next }, hasMore, limit);
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}

function feedTabToActivityKinds(
  tab: CommunityFeedQueryInput['tab'],
): readonly ActivityKind[] | undefined {
  if (tab === undefined) {
    return undefined;
  }
  switch (tab) {
    case 'posts':
    case 'guides':
      return ['post'];
    case 'reviews':
      return ['review'];
    case 'collections':
      return ['collection'];
    case 'events':
      return ['event'];
    case 'pinned':
      return undefined;
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

function encodeActivityCursor(cursor: { occurredAt: Date; id: string }): string {
  const payload = `${cursor.occurredAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeActivityCursor(raw: string): { occurredAt: Date; id: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const occurredAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { occurredAt, id };
}

/** Same `<iso>|<id>` shape the activity and discover cursors already use. */
function encodeCommunityCursor(cursor: CommunityListCursor): string {
  const payload = `${cursor.updatedAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCommunityCursor(raw: string): CommunityListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const updatedAt = new Date(decoded.slice(0, separator));
  const id = decoded.slice(separator + 1);
  if (Number.isNaN(updatedAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { updatedAt, id };
}
