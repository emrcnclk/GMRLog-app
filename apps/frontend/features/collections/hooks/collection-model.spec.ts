import type { CollectionResponse } from '@gmrlog/types';
import { collectionCreateSchema, collectionEntriesPutSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import {
  addCollectionEntry,
  entriesToPutPayload,
  hasDuplicateGameId,
  isCollectionOwner,
  moveCollectionEntry,
  removeCollectionEntry,
  resolveListView,
  toEditableEntries,
} from './collection-model';

function collection(partial: Partial<CollectionResponse> = {}): CollectionResponse {
  return {
    id: 'c1',
    title: 'Souls',
    description: null,
    owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
    visibility: 'public',
    entries: [],
    updatedAt: '2026-07-27T12:00:00.000Z',
    ...partial,
  };
}

describe('collection model', () => {
  it('resolves list loading empty ready', () => {
    expect(
      resolveListView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [collection()],
        isRefreshing: true,
      }).status,
    ).toBe('ready');
  });

  it('detects owner', () => {
    expect(isCollectionOwner(collection(), 'u1')).toBe(true);
    expect(isCollectionOwner(collection(), 'u2')).toBe(false);
  });

  it('reorders removes and prevents duplicate entries', () => {
    const base = toEditableEntries([
      {
        gameId: 'g1',
        position: 0,
        note: null,
        game: { id: 'g1', title: 'A', slug: 'a', coverUrl: null },
      },
      {
        gameId: 'g2',
        position: 1,
        note: 'x',
        game: { id: 'g2', title: 'B', slug: 'b', coverUrl: null },
      },
    ]);
    expect(moveCollectionEntry(base, 0, 1).map((e) => e.gameId)).toEqual(['g2', 'g1']);
    expect(removeCollectionEntry(base, 'g1').map((e) => e.gameId)).toEqual(['g2']);
    expect(hasDuplicateGameId(base, 'g1')).toBe(true);
    expect(addCollectionEntry(base, { gameId: 'g1', title: 'A' })).toBe('duplicate');
    expect(addCollectionEntry(base, { gameId: 'g3', title: 'C' })).toHaveLength(3);
  });

  it('builds put payload preserving order', () => {
    const payload = entriesToPutPayload([
      { gameId: 'g2', note: null, title: 'B' },
      { gameId: 'g1', note: 'Best', title: 'A' },
    ]);
    expect(payload.entries.map((e) => e.gameId)).toEqual(['g2', 'g1']);
    expect(collectionEntriesPutSchema.parse(payload).entries[1]?.note).toBe('Best');
  });

  it('validates create schema', () => {
    expect(collectionCreateSchema.parse({ title: 'Room', visibility: 'private' }).title).toBe(
      'Room',
    );
  });
});
