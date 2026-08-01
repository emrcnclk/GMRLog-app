import type { Prisma } from '@gmrlog/database';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../infrastructure/database/prisma.service';

import {
  DYNAMIC_COLLECTION_RULE_KEYS,
  DynamicCollectionResolver,
} from './dynamic-collection.resolver';

function createPrismaStub(
  findManyImpl: (args: {
    where: Prisma.GameWhereInput;
    take: number;
  }) => Promise<Array<{ id: string }>>,
): PrismaService {
  return {
    game: {
      findMany: vi.fn(findManyImpl),
    },
  } as unknown as PrismaService;
}

describe('DynamicCollectionResolver', () => {
  it('exposes the closed D3.22 rule catalog', () => {
    expect(DYNAMIC_COLLECTION_RULE_KEYS).toEqual([
      'horror_under_5h',
      'soulslike',
      'hidden_gems',
      'steam_deck_verified',
      'cozy_games',
      'under_10_usd',
    ]);
  });

  it('fails closed for null and unknown ruleKeys', async () => {
    const prisma = createPrismaStub(async () => [{ id: 'should-not-run' }]);
    const resolver = new DynamicCollectionResolver(prisma);
    expect(await resolver.resolveGameIds(null)).toEqual([]);
    expect(await resolver.resolveGameIds('unknown_rule')).toEqual([]);
    expect(prisma.game.findMany).not.toHaveBeenCalled();
  });

  it.each([
    'horror_under_5h',
    'soulslike',
    'hidden_gems',
    'steam_deck_verified',
    'cozy_games',
    'under_10_usd',
  ] as const)('resolves %s via catalog query', async (ruleKey) => {
    const prisma = createPrismaStub(async () => [{ id: `${ruleKey}-game` }]);
    const resolver = new DynamicCollectionResolver(prisma);
    await expect(resolver.resolveGameIds(ruleKey)).resolves.toEqual([`${ruleKey}-game`]);
    expect(prisma.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
      }),
    );
  });
});
