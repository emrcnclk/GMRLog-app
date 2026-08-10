import type {
  Community,
  CommunityActivity,
  CommunityActivityFeedRow,
  CommunityActivityRepository,
  CommunityListOptions,
  CommunityMember,
  CommunityMemberBadge,
  CommunityMemberBadgeRepository,
  CommunityMemberRepository,
  CommunityPin,
  CommunityPinRepository,
  CommunityRepository,
  CommunityWikiPage,
  CommunityWikiRepository,
  PostRepository,
  Prisma,
  User,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-gen-${idCounter.toString(36)}-${Date.now().toString(36)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    id: 'community-1',
    name: 'Culture Room',
    slug: 'culture-room',
    description: null,
    visibility: 'public',
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    joinType: 'public' as const,
    kind: 'games' as const,
    tags: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeCommunityMember(overrides: Partial<CommunityMember> = {}): CommunityMember {
  return {
    id: 'member-1',
    communityId: 'community-1',
    userId: 'user-1',
    role: 'owner',
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeWikiPage(overrides: Partial<CommunityWikiPage> = {}): CommunityWikiPage {
  return {
    id: 'wiki-1',
    communityId: 'community-1',
    slug: 'home',
    title: 'Home',
    body: 'Welcome',
    updatedById: 'user-1',
    version: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeCommunityPin(overrides: Partial<CommunityPin> = {}): CommunityPin {
  return {
    id: 'pin-1',
    communityId: 'community-1',
    objectType: 'post',
    objectId: 'post-1',
    position: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeCommunityBadge(
  overrides: Partial<CommunityMemberBadge> = {},
): CommunityMemberBadge {
  return {
    id: 'badge-1',
    memberId: 'member-1',
    communityId: 'community-1',
    kind: 'founder',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeCommunityRepository extends CommunityRepository {
  rows: Map<string, Community>;
}

export function createFakeCommunityRepository(seed: Community[] = []): FakeCommunityRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.CommunityCreateInput) => {
      const community = makeCommunity({
        id: nextId('community'),
        name: typeof data.name === 'string' ? data.name : 'Community',
        slug: typeof data.slug === 'string' ? data.slug : nextId('slug'),
        visibility: data.visibility ?? 'public',
        description:
          typeof data.description === 'string' || data.description === null
            ? data.description
            : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(community.id, community);
      return Promise.resolve(community);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findManyByIds: (ids) =>
      Promise.resolve(
        ids
          .map((id) => rows.get(id))
          .filter((row): row is Community => row !== undefined && row.deletedAt == null),
      ),
    findBySlug: (slug) =>
      Promise.resolve([...rows.values()].find((row) => row.slug === slug) ?? null),
    findActiveById: (id) => {
      const row = rows.get(id);
      return Promise.resolve(row != null && row.deletedAt == null ? row : null);
    },
    listPublic: (options) =>
      Promise.resolve(
        paginateCommunityRows(
          [...rows.values()].filter((row) => row.deletedAt == null && row.visibility === 'public'),
          options,
        ),
      ),
    searchByName: (query) => {
      const q = query.toLowerCase();
      return Promise.resolve(
        [...rows.values()]
          .filter(
            (row) =>
              row.deletedAt == null &&
              row.visibility === 'public' &&
              (row.name.toLowerCase().includes(q) ||
                row.tags.some((tag) => tag.toLowerCase() === q)),
          )
          .sort((a, b) => {
            if (a.updatedAt.getTime() !== b.updatedAt.getTime()) {
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            }
            return b.id.localeCompare(a.id);
          }),
      );
    },
    listDiscoverableForMemberCommunityIds: (memberCommunityIds, options) => {
      const memberIds = new Set(memberCommunityIds);
      return Promise.resolve(
        paginateCommunityRows(
          [...rows.values()].filter(
            (row) =>
              row.deletedAt == null && (row.visibility === 'public' || memberIds.has(row.id)),
          ),
          options,
        ),
      );
    },
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`community ${id} not found`));
      }
      const next: Community = {
        ...current,
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(typeof data.description === 'string' || data.description === null
          ? { description: data.description }
          : {}),
        ...(typeof data.visibility === 'string' ? { visibility: data.visibility } : {}),
        ...(typeof data.joinType === 'string' ? { joinType: data.joinType } : {}),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`community ${id} not found`));
      }
      const next: Community = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
  };
}

/**
 * Mirrors the Prisma repository's `updatedAt desc, id desc` keyset so the fakes
 * page exactly the way the real query does — otherwise a paging bug only shows
 * up against a live database.
 *
 * One deliberate divergence: the real query also requires an owner membership
 * row, which this fake has no access to. It only ever *removes* rows the
 * service's own projection would drop anyway, so both paths return the same
 * items; the real one additionally guarantees the page is not short.
 */
function paginateCommunityRows(rows: Community[], options: CommunityListOptions): Community[] {
  const byKind =
    options.kind === undefined ? rows : rows.filter((row) => row.kind === options.kind);
  const sorted = byKind.sort((a, b) => {
    if (a.updatedAt.getTime() !== b.updatedAt.getTime()) {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
    return b.id.localeCompare(a.id);
  });
  const { cursor } = options;
  const after =
    cursor === undefined
      ? sorted
      : sorted.filter(
          (row) =>
            row.updatedAt.getTime() < cursor.updatedAt.getTime() ||
            (row.updatedAt.getTime() === cursor.updatedAt.getTime() &&
              row.id.localeCompare(cursor.id) < 0),
        );
  return after.slice(0, options.limit);
}

export interface FakeCommunityMemberRepository extends CommunityMemberRepository {
  rows: Map<string, CommunityMember>;
}

export function createFakeCommunityMemberRepository(
  seed: CommunityMember[] = [],
): FakeCommunityMemberRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const findByCommunityAndUser = (
    communityId: string,
    userId: string,
  ): Promise<CommunityMember | null> =>
    Promise.resolve(
      [...rows.values()].find((row) => row.communityId === communityId && row.userId === userId) ??
        null,
    );

  return {
    rows,
    create: (data: Prisma.CommunityMemberCreateInput) => {
      const communityId = connectId(data.community);
      const userId = connectId(data.user);
      if (!communityId || !userId) {
        return Promise.reject(new Error('community and user required'));
      }
      const member = makeCommunityMember({
        id: nextId('member'),
        communityId,
        userId,
        role: data.role,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(member.id, member);
      return Promise.resolve(member);
    },
    findByCommunityAndUser,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    listByCommunity: (communityId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.communityId === communityId)
          .sort((a, b) => {
            const byTime = a.joinedAt.getTime() - b.joinedAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    listCommunityIdsByUser: (userId) =>
      Promise.resolve(
        [...rows.values()].filter((row) => row.userId === userId).map((row) => row.communityId),
      ),
    countByCommunity: (communityId) =>
      Promise.resolve([...rows.values()].filter((row) => row.communityId === communityId).length),
    countByCommunityIds: (communityIds) => {
      const wanted = new Set(communityIds);
      const counts = new Map<string, number>();
      for (const row of rows.values()) {
        if (wanted.has(row.communityId)) {
          counts.set(row.communityId, (counts.get(row.communityId) ?? 0) + 1);
        }
      }
      return Promise.resolve(counts);
    },
    listByCommunityIdsAndUser: (communityIds, userId) => {
      const wanted = new Set(communityIds);
      return Promise.resolve(
        [...rows.values()].filter((row) => wanted.has(row.communityId) && row.userId === userId),
      );
    },
    listOwnersByCommunityIds: (communityIds) => {
      const wanted = new Set(communityIds);
      return Promise.resolve(
        [...rows.values()].filter((row) => wanted.has(row.communityId) && row.role === 'owner'),
      );
    },
    countByCommunityIdsForUsers: (communityIds, userIds) => {
      const wantedCommunities = new Set(communityIds);
      const wantedUsers = new Set(userIds);
      const counts = new Map<string, number>();
      for (const row of rows.values()) {
        if (wantedCommunities.has(row.communityId) && wantedUsers.has(row.userId)) {
          counts.set(row.communityId, (counts.get(row.communityId) ?? 0) + 1);
        }
      }
      return Promise.resolve(counts);
    },
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`member ${id} not found`));
      }
      const next: CommunityMember = {
        ...current,
        ...(typeof data.role === 'string' ? { role: data.role } : {}),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`member ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
    deleteByCommunityAndUser: async (communityId, userId) => {
      const existing = await findByCommunityAndUser(communityId, userId);
      if (!existing) {
        return null;
      }
      rows.delete(existing.id);
      return existing;
    },
  };
}

export interface FakeCommunityActivityRepository extends CommunityActivityRepository {
  rows: { communityId: string; row: CommunityActivityFeedRow }[];
}

export function createFakeCommunityActivityRepository(
  seed: { communityId: string; row: CommunityActivityFeedRow }[] = [],
): FakeCommunityActivityRepository {
  const rows = [...seed];

  return {
    rows,
    create: (data: Prisma.CommunityActivityCreateInput) => {
      const communityId = connectId(data.community);
      const activityItemId = connectId(data.activityItem);
      if (!communityId || !activityItemId) {
        return Promise.reject(new Error('community and activityItem required'));
      }
      const created: CommunityActivity = {
        id: nextId('community-activity'),
        communityId,
        activityItemId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(created);
    },
    listByCommunity: (communityId, params) => {
      let list = rows
        .filter((entry) => entry.communityId === communityId)
        .map((entry) => entry.row);

      list = [...list].sort((a, b) => {
        const byTime = b.activityItem.occurredAt.getTime() - a.activityItem.occurredAt.getTime();
        return byTime !== 0 ? byTime : b.activityItem.id.localeCompare(a.activityItem.id);
      });

      if (params.kinds !== undefined && params.kinds.length > 0) {
        const kindSet = new Set(params.kinds);
        list = list.filter((row) => kindSet.has(row.activityItem.kind));
      }
      if (params.from !== undefined) {
        const fromTime = params.from.getTime();
        list = list.filter((row) => row.activityItem.occurredAt.getTime() >= fromTime);
      }
      if (params.to !== undefined) {
        const toTime = params.to.getTime();
        list = list.filter((row) => row.activityItem.occurredAt.getTime() <= toTime);
      }
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.occurredAt.getTime();
        list = list.filter((row) => {
          const time = row.activityItem.occurredAt.getTime();
          return time < cursorTime || (time === cursorTime && row.activityItem.id < cursor.id);
        });
      }

      return Promise.resolve(list.slice(0, params.limit));
    },
    countPostActivityByCommunityIdsSince: (communityIds, since) => {
      const idSet = new Set(communityIds);
      const counts = new Map<string, number>();
      for (const entry of rows) {
        if (!idSet.has(entry.communityId)) {
          continue;
        }
        if (entry.row.activityItem.kind !== 'post') {
          continue;
        }
        if (entry.row.activityItem.occurredAt.getTime() < since.getTime()) {
          continue;
        }
        counts.set(entry.communityId, (counts.get(entry.communityId) ?? 0) + 1);
      }
      return Promise.resolve(counts);
    },
  };
}

export interface FakeCommunityWikiRepository extends CommunityWikiRepository {
  rows: Map<string, CommunityWikiPage>;
}

export function createFakeCommunityWikiRepository(
  seed: CommunityWikiPage[] = [],
): FakeCommunityWikiRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.CommunityWikiPageCreateInput) => {
      const communityId = connectId(data.community);
      const updatedById = connectId(data.updatedBy);
      if (!communityId || !updatedById) {
        return Promise.reject(new Error('community and updatedBy required'));
      }
      const page = makeWikiPage({
        id: nextId('wiki'),
        communityId,
        slug: typeof data.slug === 'string' ? data.slug : 'page',
        title: typeof data.title === 'string' ? data.title : 'Page',
        body: typeof data.body === 'string' ? data.body : '',
        updatedById,
        version: typeof data.version === 'number' ? data.version : 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(page.id, page);
      return Promise.resolve(page);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findBySlug: (communityId, slug) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.communityId === communityId && row.slug === slug) ??
          null,
      ),
    listByCommunity: (communityId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.communityId === communityId)
          .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
      ),
    countByUpdatedBy: (communityId) => {
      const counts = new Map<string, number>();
      for (const row of rows.values()) {
        if (row.communityId !== communityId) continue;
        counts.set(row.updatedById, (counts.get(row.updatedById) ?? 0) + 1);
      }
      return Promise.resolve(
        [...counts.entries()].map(([updatedById, count]) => ({ updatedById, count })),
      );
    },
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`wiki ${id} not found`));
      }
      const updatedById = connectId(data.updatedBy) ?? current.updatedById;
      let version = current.version;
      if (typeof data.version === 'number') {
        version = data.version;
      } else if (
        typeof data.version === 'object' &&
        data.version !== null &&
        'increment' in data.version &&
        typeof data.version.increment === 'number'
      ) {
        version = current.version + data.version.increment;
      }
      const next: CommunityWikiPage = {
        ...current,
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        ...(typeof data.body === 'string' ? { body: data.body } : {}),
        updatedById,
        version,
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`wiki ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeCommunityPinRepository extends CommunityPinRepository {
  rows: Map<string, CommunityPin>;
}

export function createFakeCommunityPinRepository(
  seed: CommunityPin[] = [],
): FakeCommunityPinRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.CommunityPinCreateInput) => {
      const communityId = connectId(data.community);
      if (!communityId) {
        return Promise.reject(new Error('community required'));
      }
      const pin = makeCommunityPin({
        id: nextId('pin'),
        communityId,
        objectType: typeof data.objectType === 'string' ? data.objectType : 'post',
        objectId: typeof data.objectId === 'string' ? data.objectId : nextId('object'),
        position: typeof data.position === 'number' ? data.position : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(pin.id, pin);
      return Promise.resolve(pin);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByObject: (communityId, objectType, objectId) =>
      Promise.resolve(
        [...rows.values()].find(
          (row) =>
            row.communityId === communityId &&
            row.objectType === objectType &&
            row.objectId === objectId,
        ) ?? null,
      ),
    listByCommunity: (communityId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.communityId === communityId)
          .sort((a, b) => a.position - b.position || b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    countByCommunity: (communityId) =>
      Promise.resolve([...rows.values()].filter((row) => row.communityId === communityId).length),
    updatePosition: (id, position) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`pin ${id} not found`));
      }
      const next = { ...current, position, updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`pin ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeCommunityBadgeRepository extends CommunityMemberBadgeRepository {
  rows: Map<string, CommunityMemberBadge>;
}

export function createFakeCommunityBadgeRepository(
  seed: CommunityMemberBadge[] = [],
): FakeCommunityBadgeRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.CommunityMemberBadgeCreateInput) => {
      const memberId = connectId(data.member);
      const communityId = connectId(data.community);
      if (!memberId || !communityId) {
        return Promise.reject(new Error('member and community required'));
      }
      const badge = makeCommunityBadge({
        id: nextId('badge'),
        memberId,
        communityId,
        kind: data.kind,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(badge.id, badge);
      return Promise.resolve(badge);
    },
    findByMemberAndKind: (memberId, kind) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.memberId === memberId && row.kind === kind) ?? null,
      ),
    listByMember: (memberId) =>
      Promise.resolve([...rows.values()].filter((row) => row.memberId === memberId)),
    listByCommunity: (communityId) =>
      Promise.resolve([...rows.values()].filter((row) => row.communityId === communityId)),
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`badge ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeCommunityPostRepository extends Pick<
  PostRepository,
  'countByCommunityGroupedByAuthor' | 'findActiveById'
> {
  counts: Map<string, { authorId: string; count: number }[]>;
  activeById: Map<string, { id: string; authorId: string; deletedAt: Date | null }>;
}

export function createFakeCommunityPostRepository(
  seed: { communityId: string; authorId: string; count: number }[] = [],
): FakeCommunityPostRepository {
  const counts = new Map<string, { authorId: string; count: number }[]>();
  const activeById = new Map<string, { id: string; authorId: string; deletedAt: Date | null }>();
  for (const row of seed) {
    const list = counts.get(row.communityId) ?? [];
    list.push({ authorId: row.authorId, count: row.count });
    counts.set(row.communityId, list);
  }
  return {
    counts,
    activeById,
    countByCommunityGroupedByAuthor: (communityId) =>
      Promise.resolve(counts.get(communityId) ?? []),
    findActiveById: (id) => {
      const row = activeById.get(id);
      return Promise.resolve(row != null && row.deletedAt == null ? (row as never) : null);
    },
  };
}
