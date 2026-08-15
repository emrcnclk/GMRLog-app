import type {
  LibraryEntryRepository,
  PlayerMetricsRepository,
  ProfilePinRepository,
  UserArchetypeRepository,
  UserRepository,
  UserReputationRepository,
} from '@gmrlog/database';
import type { ProfileHeroResponse } from '@gmrlog/types';
import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';

import { CreatorEligibilityService } from '../creator/creator-eligibility.service';
import { PrismaService } from '../infrastructure/database/prisma.service';

import {
  PROFILE_HERO_ARCHETYPE_REPOSITORY,
  PROFILE_HERO_LIBRARY_REPOSITORY,
  PROFILE_HERO_METRICS_REPOSITORY,
  PROFILE_HERO_PIN_REPOSITORY,
  PROFILE_HERO_REPUTATION_REPOSITORY,
  PROFILE_HERO_USER_REPOSITORY,
} from './profile-hero.tokens';

/**
 * 9.5b — the profile card's serial, formatted once, server-side, so the
 * client never re-derives padding width. Padded to a floor of 4 digits
 * (§6's "№ 0042"); a card number past 9999 grows naturally past the floor
 * rather than truncating.
 */
export function formatCardNumber(cardNumber: number): string {
  return String(cardNumber).padStart(4, '0');
}

/**
 * Profile Hero composition (D3.24 / PROFILE_V2.md).
 * First glance = player character — Statistics · Library · Archetypes ·
 * ProfilePins · Steam (when linked) · UserReputation · Creator badge.
 */
@Injectable()
export class ProfileHeroService {
  constructor(
    @Inject(PROFILE_HERO_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_HERO_METRICS_REPOSITORY) private readonly metrics: PlayerMetricsRepository,
    @Inject(PROFILE_HERO_LIBRARY_REPOSITORY) private readonly library: LibraryEntryRepository,
    @Inject(PROFILE_HERO_PIN_REPOSITORY) private readonly pins: ProfilePinRepository,
    @Inject(PROFILE_HERO_ARCHETYPE_REPOSITORY)
    private readonly archetypes: UserArchetypeRepository,
    @Inject(PROFILE_HERO_REPUTATION_REPOSITORY)
    private readonly reputations: UserReputationRepository,
    private readonly prisma: PrismaService,
    @Optional() private readonly creatorEligibility: CreatorEligibilityService | null = null,
  ) {}

  async getHero(userId: string): Promise<ProfileHeroResponse> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }

    const [snapshot, playing, pins, archetypeRows, reputationRows, steamLevel, creatorBadge] =
      await Promise.all([
        this.metrics.loadSnapshot(userId),
        this.library.listByUser(userId, { status: 'playing' }),
        this.pins.listByUser(userId),
        this.archetypes.listByUser(userId),
        this.reputations.listByUser(userId),
        this.resolveSteamLevel(userId),
        this.creatorEligibility != null
          ? this.creatorEligibility.isEligible(userId)
          : Promise.resolve(user.creatorFeatured),
      ]);

    if (snapshot == null) {
      throw new NotFoundException('User not found');
    }

    const gamesLogged = snapshot.libraryEntries.length;
    const gamesCompleted = snapshot.libraryEntries.filter((e) => e.status === 'completed').length;
    const completionPercent =
      gamesLogged === 0 ? 0 : Math.round((gamesCompleted / gamesLogged) * 100);

    const favoriteGameIds = pins
      .filter((pin) => pin.kind === 'game')
      .sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime())
      .map((pin) => pin.objectId);

    const pinnedCollection =
      pins
        .filter((pin) => pin.kind === 'collection')
        .sort(
          (a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime(),
        )[0] ?? null;

    const topGenre =
      [...snapshot.genreCounts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0]?.[0] ?? null;

    const reputationBadges = reputationRows.map((row) => row.badge);

    return {
      steamLevel,
      completionPercent,
      currentlyPlayingGameId: playing[0]?.gameId ?? null,
      favoriteGameIds,
      pinnedCollectionId: pinnedCollection?.objectId ?? null,
      archetypeKeys: archetypeRows.map((row) => row.archetypeKey),
      memberSince: user.createdAt.toISOString(),
      topGenre,
      totalHours: snapshot.sessionLogCount,
      reputationBadges,
      creatorBadge,
      cardNumber: formatCardNumber(user.cardNumber),
    };
  }

  private async resolveSteamLevel(userId: string): Promise<number | null> {
    const profile = await this.prisma.externalProfile.findFirst({
      where: { userId, provider: 'steam' },
      select: { raw: true },
    });
    if (profile?.raw == null || typeof profile.raw !== 'object' || Array.isArray(profile.raw)) {
      return null;
    }
    const raw = profile.raw as Record<string, unknown>;
    const candidates = [raw.personalevel, raw.steamLevel, raw.level, raw.player_level];
    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  }
}
