import type {
  SteamProfileResponse,
  SteamStatusResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import type { SteamConnectInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

import {
  toSteamProfileResponse,
  toSteamStatusResponse,
  toUserIntegrationResponse,
} from './mappers/integrations.mapper';
import { parseSteamIdentity, SteamIdParseError } from './steam/steam-id.parser';
import { STEAM_WEB_API_CLIENT, type SteamWebApiClient } from './steam/steam-web-api.client';

/**
 * Steam connect / disconnect / status / profile (D3.23 / STEAM_IMPORT.md).
 */
@Injectable()
export class SteamConnectService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STEAM_WEB_API_CLIENT) private readonly steam: SteamWebApiClient,
  ) {}

  async connect(userId: string, input: SteamConnectInput): Promise<UserIntegrationResponse> {
    let steamId64: string;
    let vanity: string | null = null;

    try {
      const parsed = parseSteamIdentity(input.steamIdOrUrl);
      if (parsed.kind === 'steamId64') {
        steamId64 = parsed.steamId64;
      } else {
        vanity = parsed.vanity;
        const resolved = await this.steam.resolveVanity(parsed.vanity);
        if (resolved === null) {
          throw new BadRequestException('Steam vanity URL could not be resolved');
        }
        steamId64 = resolved;
      }
    } catch (error: unknown) {
      if (error instanceof SteamIdParseError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return this.upsertConnection({ userId, steamId64, vanity, verified: false });
  }

  /**
   * Task 4.5 — the SteamID here has already been proven, via OpenID 2.0
   * `check_authentication` (`SteamOpenIdProvider.verifyAssertion`), to
   * belong to whoever completed the browser round-trip. Unlike `connect()`
   * there is no user-supplied string to parse or vanity to resolve, and the
   * write additionally records an `AccountLink(purpose: 'connect')` audit
   * row — the proof-of-ownership event `connect()`'s self-reported path
   * never had grounds to claim.
   */
  async connectVerified(userId: string, steamId64: string): Promise<UserIntegrationResponse> {
    return this.upsertConnection({ userId, steamId64, vanity: null, verified: true });
  }

  private async upsertConnection(params: {
    userId: string;
    steamId64: string;
    vanity: string | null;
    verified: boolean;
  }): Promise<UserIntegrationResponse> {
    const { userId, steamId64, vanity, verified } = params;

    const summary = await this.steam.getPlayerSummary(steamId64);
    const displayName = summary?.personaName ?? steamId64;
    const now = new Date();

    // One SteamID cannot back two players' connections — checked before
    // every write, verified or not, so a verified attempt can't steal a
    // SteamID a manual entry already claimed, or vice versa.
    const existingOther = await this.prisma.userIntegration.findFirst({
      where: {
        provider: 'steam',
        externalRef: steamId64,
        NOT: { userId },
        status: 'connected',
      },
    });
    if (existingOther !== null) {
      throw new ConflictException('Steam account already linked to another user');
    }

    // Re-connecting (including re-verifying) the same user's own Steam
    // account is idempotent: the upsert below just refreshes the existing
    // row rather than rejecting or duplicating it.
    const integration = await this.prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider: 'steam' } },
      create: {
        userId,
        provider: 'steam',
        externalRef: steamId64,
        displayName,
        status: 'connected',
        syncType: 'manual',
        connectedAt: now,
        disconnectedAt: null,
      },
      update: {
        externalRef: steamId64,
        displayName,
        status: 'connected',
        connectedAt: now,
        disconnectedAt: null,
      },
    });

    // Upsert by (provider, externalId) — reconnect after disconnect must not
    // collide with a stale ExternalProfile still keyed to a prior integration.
    await this.prisma.externalProfile.upsert({
      where: { provider_externalId: { provider: 'steam', externalId: steamId64 } },
      create: {
        userId,
        integrationId: integration.id,
        provider: 'steam',
        externalId: steamId64,
        vanityUrl: vanity !== null ? `https://steamcommunity.com/id/${vanity}` : null,
        displayName,
        avatarUrl: summary?.avatarUrl ?? null,
        profileUrl: summary?.profileUrl ?? `https://steamcommunity.com/profiles/${steamId64}`,
        lastSyncAt: now,
      },
      update: {
        userId,
        integrationId: integration.id,
        vanityUrl: vanity !== null ? `https://steamcommunity.com/id/${vanity}` : undefined,
        displayName,
        avatarUrl: summary?.avatarUrl ?? null,
        profileUrl: summary?.profileUrl ?? `https://steamcommunity.com/profiles/${steamId64}`,
        lastSyncAt: now,
      },
    });

    await this.prisma.connectedAccount.upsert({
      where: { userId_provider: { userId, provider: 'steam' } },
      create: {
        userId,
        provider: 'steam',
        status: 'connected',
        linkedAt: now,
        scopes: [],
      },
      update: {
        status: 'connected',
        linkedAt: now,
      },
    });

    if (verified) {
      await this.prisma.accountLink.create({
        data: {
          user: { connect: { id: userId } },
          provider: 'steam',
          purpose: 'connect',
          status: 'completed',
        },
      });
    }

    await this.prisma.activityItem.create({
      data: {
        kind: 'integration_connected',
        actorId: userId,
        objectType: 'user',
        objectId: integration.id,
        occurredAt: now,
      },
    });

    return this.toResponse(integration);
  }

  async disconnect(userId: string): Promise<void> {
    const integration = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: 'steam' } },
    });
    if (integration === null || integration.status === 'disconnected') {
      throw new NotFoundException('Steam integration not connected');
    }

    const now = new Date();
    await this.prisma.userIntegration.update({
      where: { id: integration.id },
      data: { status: 'disconnected', disconnectedAt: now },
    });

    await this.prisma.connectedAccount.updateMany({
      where: { userId, provider: 'steam' },
      data: { status: 'disconnected' },
    });

    await this.prisma.activityItem.create({
      data: {
        kind: 'integration_disconnected',
        actorId: userId,
        objectType: 'user',
        objectId: integration.id,
        occurredAt: now,
      },
    });
  }

  async status(userId: string): Promise<SteamStatusResponse> {
    const integration = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: 'steam' } },
    });
    if (integration?.status !== 'connected') {
      return toSteamStatusResponse(null);
    }
    return toSteamStatusResponse(await this.toResponse(integration));
  }

  async profile(userId: string): Promise<SteamProfileResponse> {
    const integration = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: 'steam' } },
    });
    if (integration?.status !== 'connected') {
      throw new NotFoundException('Steam integration not connected');
    }

    const profile = await this.prisma.externalProfile.findUnique({
      where: { integrationId: integration.id },
    });
    if (profile === null) {
      throw new NotFoundException('Steam profile not found');
    }

    return toSteamProfileResponse(profile);
  }

  private async toResponse(integration: {
    id: string;
    provider: 'steam' | 'xbox' | 'playstation' | 'epic' | 'nintendo' | 'csv';
    externalRef: string;
    displayName: string | null;
    status: string;
    syncType: 'manual' | 'daily' | 'weekly' | 'monthly' | 'automatic';
    lastSyncAt: Date | null;
    connectedAt: Date;
  }): Promise<UserIntegrationResponse> {
    const [gamesImported, achievementsSynced] = await Promise.all([
      this.prisma.externalGame.count({ where: { integrationId: integration.id } }),
      this.prisma.externalAchievement.count({ where: { integrationId: integration.id } }),
    ]);
    return toUserIntegrationResponse(integration, { gamesImported, achievementsSynced });
  }
}
