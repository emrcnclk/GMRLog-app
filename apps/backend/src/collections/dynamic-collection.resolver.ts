import type { Prisma } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

/** Closed D3.22 dynamic rule catalog — docs/09_DISCOVERY/COLLECTION_TYPES.md */
export const DYNAMIC_COLLECTION_RULE_KEYS = [
  'horror_under_5h',
  'soulslike',
  'hidden_gems',
  'steam_deck_verified',
  'cozy_games',
  'under_10_usd',
] as const;

export type DynamicCollectionRuleKey = (typeof DYNAMIC_COLLECTION_RULE_KEYS)[number];

const DYNAMIC_MEMBERSHIP_LIMIT = 50;

/** Soft popularity ceiling used when a rule needs a “low popularity” signal. */
const LOW_POPULARITY_CEILING = 25;

function isDynamicRuleKey(value: string): value is DynamicCollectionRuleKey {
  return (DYNAMIC_COLLECTION_RULE_KEYS as readonly string[]).includes(value);
}

/**
 * Resolves dynamic collection membership at read time from a closed `ruleKey`
 * catalog. Unknown keys fail closed (empty membership). Caps at 50 game ids.
 */
@Injectable()
export class DynamicCollectionResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveGameIds(ruleKey: string | null): Promise<string[]> {
    if (ruleKey === null || !isDynamicRuleKey(ruleKey)) {
      return [];
    }

    switch (ruleKey) {
      case 'horror_under_5h':
        // Catalog has no playtime column yet — horror genre slug is the hard
        // signal; “under 5h” remains a product label until duration metadata ships.
        return this.findIds({
          genres: {
            some: { genre: { slug: { contains: 'horror', mode: 'insensitive' } } },
          },
        });
      case 'soulslike':
        return this.findIds({
          OR: [
            { title: { contains: 'souls', mode: 'insensitive' } },
            {
              genres: {
                some: {
                  genre: {
                    OR: [
                      { slug: { contains: 'soulslike', mode: 'insensitive' } },
                      { slug: { contains: 'souls', mode: 'insensitive' } },
                      { name: { contains: 'soulslike', mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          ],
        });
      case 'hidden_gems':
        return this.findIds({
          featured: false,
          popularity: { lte: LOW_POPULARITY_CEILING },
          reviews: { some: {} },
        });
      case 'steam_deck_verified':
        return this.findIds({
          platforms: {
            some: {
              platform: {
                OR: [
                  { slug: { contains: 'steam-deck', mode: 'insensitive' } },
                  { slug: { contains: 'deck', mode: 'insensitive' } },
                ],
              },
            },
          },
        });
      case 'cozy_games':
        return this.findIds({
          genres: {
            some: {
              genre: {
                OR: [
                  { slug: { contains: 'cozy', mode: 'insensitive' } },
                  { name: { contains: 'cozy', mode: 'insensitive' } },
                ],
              },
            },
          },
        });
      case 'under_10_usd':
        // Game has no price band column in S2. Fail soft: low-popularity,
        // non-featured catalog rows stand in until pricing metadata exists.
        // Prefer empty over inventing a price field — this proxy is documented.
        return this.findIds({
          featured: false,
          popularity: { lte: LOW_POPULARITY_CEILING },
        });
      default: {
        const _exhaustive: never = ruleKey;
        void _exhaustive;
        return [];
      }
    }
  }

  private async findIds(where: Prisma.GameWhereInput): Promise<string[]> {
    const rows = await this.prisma.game.findMany({
      where,
      select: { id: true },
      orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
      take: DYNAMIC_MEMBERSHIP_LIMIT,
    });
    return rows.map((row) => row.id);
  }
}
