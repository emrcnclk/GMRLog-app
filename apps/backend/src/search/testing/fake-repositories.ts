import type { SearchHitRecord, SearchListCursor, SearchListParams } from '@gmrlog/database';

export function createFakeSearchRepository(initial: SearchHitRecord[] = []): FakeSearchRepository {
  return {
    hits: [...initial],
    search(params: SearchListParams): Promise<SearchHitRecord[]> {
      const q = params.query.trim().toLowerCase();
      let rows = this.hits.filter((hit) => matchesQuery(hit, q) && isVisible(hit, params.viewerId));
      rows.sort(compareFakeHitsDesc);
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        rows = rows.filter((hit) => isAfterCursor(hit, cursor));
      }
      return Promise.resolve(rows.slice(0, params.limit + 1));
    },
  };
}

export interface FakeSearchRepository {
  hits: SearchHitRecord[];
  search(params: SearchListParams): Promise<SearchHitRecord[]>;
}

const TYPE_RANK: Record<SearchHitRecord['type'], number> = {
  game: 0,
  user: 1,
  review: 2,
  post: 3,
  collection: 4,
  'tier-list': 5,
  community: 6,
  event: 7,
};

function isVisible(hit: SearchHitRecord, viewerId: string | null): boolean {
  if (hit.type !== 'post') {
    return true;
  }
  if (hit.post.visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  return hit.post.authorId === viewerId;
}

function matchesQuery(hit: SearchHitRecord, q: string): boolean {
  if (q.length === 0) {
    return false;
  }
  switch (hit.type) {
    case 'game':
      return hit.game.title.toLowerCase().includes(q) || hit.game.slug.toLowerCase().includes(q);
    case 'user':
      return (
        hit.user.handle.toLowerCase().includes(q) || hit.user.displayName.toLowerCase().includes(q)
      );
    case 'review':
      return (
        (hit.review.body?.toLowerCase().includes(q) ?? false) ||
        hit.game.title.toLowerCase().includes(q)
      );
    case 'post':
      return hit.post.body.toLowerCase().includes(q);
    case 'collection':
      return (
        hit.collection.title.toLowerCase().includes(q) ||
        (hit.collection.description?.toLowerCase().includes(q) ?? false)
      );
    case 'tier-list':
      return hit.tierList.title.toLowerCase().includes(q);
    case 'community':
      return (
        hit.community.name.toLowerCase().includes(q) ||
        (hit.community.description?.toLowerCase().includes(q) ?? false)
      );
    case 'event':
      return hit.event.title.toLowerCase().includes(q);
  }
}

function compareFakeHitsDesc(a: SearchHitRecord, b: SearchHitRecord): number {
  const at = a.orderedAt.getTime();
  const bt = b.orderedAt.getTime();
  if (at !== bt) {
    return bt - at;
  }
  const ar = TYPE_RANK[a.type];
  const br = TYPE_RANK[b.type];
  if (ar !== br) {
    return br - ar;
  }
  return b.id.localeCompare(a.id);
}

function isAfterCursor(hit: SearchHitRecord, cursor: SearchListCursor): boolean {
  const ht = hit.orderedAt.getTime();
  const ct = cursor.orderedAt.getTime();
  if (ht < ct) {
    return true;
  }
  if (ht > ct) {
    return false;
  }
  const hr = TYPE_RANK[hit.type];
  const cr = TYPE_RANK[cursor.type];
  if (hr < cr) {
    return true;
  }
  if (hr > cr) {
    return false;
  }
  return hit.id < cursor.id;
}
