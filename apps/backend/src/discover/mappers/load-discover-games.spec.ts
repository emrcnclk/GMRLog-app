import { describe, expect, it, vi } from 'vitest';

import { loadDiscoverGameRecords } from './load-discover-games';

describe('loadDiscoverGameRecords', () => {
  it('returns empty for empty ids', async () => {
    const prisma = { game: { findMany: vi.fn() } };
    await expect(loadDiscoverGameRecords(prisma as never, [])).resolves.toEqual([]);
    expect(prisma.game.findMany).not.toHaveBeenCalled();
  });

  it('returns empty when none of the ids exist', async () => {
    const prisma = { game: { findMany: vi.fn().mockResolvedValue([]) } };
    await expect(loadDiscoverGameRecords(prisma as never, ['missing'])).resolves.toEqual([]);
  });

  it('preserves order and enriches records', async () => {
    const gameA = {
      id: 'a',
      title: 'A',
      slug: 'a',
      coverKey: null,
      releaseDate: null,
      featured: false,
      popularity: 1,
      franchiseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const gameB = { ...gameA, id: 'b', title: 'B', slug: 'b' };
    const prisma = {
      game: { findMany: vi.fn().mockResolvedValue([gameB, gameA]) },
      gameGenre: { findMany: vi.fn().mockResolvedValue([]) },
      gamePlatform: { findMany: vi.fn().mockResolvedValue([]) },
      libraryEntry: { groupBy: vi.fn().mockResolvedValue([]) },
      review: { groupBy: vi.fn().mockResolvedValue([]) },
    };

    const rows = await loadDiscoverGameRecords(prisma as never, ['a', 'b']);
    expect(rows.map((row) => row.game.id)).toEqual(['a', 'b']);
    expect(rows[0]?.libraryCount).toBe(0);
  });
});
