import { describe, expect, it, vi } from 'vitest';

import { MeiliClientService } from './meili.client';
import { SearchIndexService, meiliIndexKeyForType } from './search-index.service';
import type { MeiliSearchDocument } from './meili.types';

const orderedAt = '2026-01-01T00:00:00.000Z';

function makeDocument(type: MeiliSearchDocument['type']): MeiliSearchDocument {
  switch (type) {
    case 'game':
      return { id: 'game-1', type, orderedAt, title: 'Hollow', slug: 'hollow' };
    case 'user':
      return { id: 'user-1', type, orderedAt, handle: 'player', displayName: 'Player' };
    case 'post':
      return {
        id: 'post-1',
        type,
        orderedAt,
        visibility: 'public',
        authorId: 'user-1',
        body: 'Hello',
      };
    case 'review':
      return {
        id: 'review-1',
        type,
        orderedAt,
        visibility: 'public',
        authorId: 'user-1',
        body: 'Great',
        gameTitle: 'Hollow',
      };
    case 'collection':
      return {
        id: 'collection-1',
        type,
        orderedAt,
        visibility: 'public',
        ownerId: 'user-1',
        title: 'Favorites',
      };
    case 'tier-list':
      return {
        id: 'tier-1',
        type,
        orderedAt,
        visibility: 'public',
        ownerId: 'user-1',
        title: '2026',
      };
    case 'community':
      return { id: 'community-1', type, orderedAt, visibility: 'public', name: 'Culture' };
    case 'event':
      return { id: 'event-1', type, orderedAt, title: 'Seasonal', kind: 'seasonal' };
  }
}

describe('SearchIndexService', () => {
  it('maps meili documents into search hit records for every type', () => {
    const meili = new MeiliClientService({ MEILI_HOST: '' } as never, { event: vi.fn() } as never);
    const service = new SearchIndexService({} as never, meili);
    const types: MeiliSearchDocument['type'][] = [
      'game',
      'user',
      'post',
      'review',
      'collection',
      'tier-list',
      'community',
      'event',
    ];

    for (const type of types) {
      const record = service.meiliDocumentToHitRecord(makeDocument(type));
      expect(record.type).toBe(type);
    }
  });

  it('no-ops upsert/delete when meili is unavailable', async () => {
    const meili = {
      isAvailable: () => false,
      upsertDocuments: vi.fn(),
      deleteDocument: vi.fn(),
    };
    const service = new SearchIndexService({} as never, meili as never);
    await service.upsert('game', 'game-1');
    await service.delete('game', 'game-1');
    expect(meili.upsertDocuments).not.toHaveBeenCalled();
    expect(meili.deleteDocument).not.toHaveBeenCalled();
  });

  it('upserts documents and deletes missing rows', async () => {
    const meili = {
      isAvailable: () => true,
      upsertDocuments: vi.fn(),
      deleteDocument: vi.fn(),
    };
    const service = new SearchIndexService({} as never, meili as never);
    const document = makeDocument('game');
    vi.spyOn(
      service as unknown as { buildDocument: () => Promise<MeiliSearchDocument | null> },
      'buildDocument',
    )
      .mockResolvedValueOnce(document)
      .mockResolvedValueOnce(null);

    await service.upsert('game', 'game-1');
    expect(meili.upsertDocuments).toHaveBeenCalledWith('games', [document]);

    await service.upsert('game', 'missing');
    expect(meili.deleteDocument).toHaveBeenCalledWith('games', 'missing');

    await service.delete('game', 'game-2');
    expect(meili.deleteDocument).toHaveBeenCalledWith('games', 'game-2');
  });
});

describe('meiliIndexKeyForType', () => {
  it('maps search hit types to meili index keys', () => {
    expect(meiliIndexKeyForType('game')).toBe('games');
    expect(meiliIndexKeyForType('tier-list')).toBe('tier_lists');
  });
});
