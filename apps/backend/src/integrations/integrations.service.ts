import type {
  IntegrationProviderInfo,
  IntegrationProviderValue,
  SyncHistoryResponse,
  SyncJobResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import type { IntegrationCreateInput, IntegrationSyncInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

import { IntegrationJobsPublisher } from './integration-jobs.publisher';
import { LibrarySyncService } from './library-sync.service';
import {
  toSyncHistoryResponse,
  toSyncJobResponse,
  toUserIntegrationResponse,
} from './mappers/integrations.mapper';
import { SteamConnectService } from './steam-connect.service';

const PROVIDERS: IntegrationProviderInfo[] = [
  { id: 'steam', label: 'Steam', connectable: true },
  { id: 'xbox', label: 'Xbox', connectable: false },
  { id: 'playstation', label: 'PlayStation', connectable: false },
  { id: 'epic', label: 'Epic Games', connectable: false },
  { id: 'nintendo', label: 'Nintendo', connectable: false },
  { id: 'csv', label: 'CSV Import', connectable: true },
];

/**
 * Integrations dashboard surface (D3.23 / API.md).
 */
@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly steamConnect: SteamConnectService,
    private readonly librarySync: LibrarySyncService,
    @Optional() private readonly jobsPublisher?: IntegrationJobsPublisher,
  ) {}

  listProviders(): IntegrationProviderInfo[] {
    return PROVIDERS;
  }

  async create(userId: string, input: IntegrationCreateInput): Promise<UserIntegrationResponse> {
    if (input.provider === 'steam') {
      return this.steamConnect.connect(userId, { steamIdOrUrl: input.externalRef });
    }

    const info = PROVIDERS.find((p) => p.id === input.provider);
    if (info === undefined) {
      throw new BadRequestException('Unknown integration provider');
    }
    if (!info.connectable && input.provider !== 'csv') {
      throw new BadRequestException(`Provider ${input.provider} connect is deferred`);
    }

    const existing = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: input.provider } },
    });
    if (existing !== null && existing.status === 'connected') {
      throw new ConflictException('Integration already connected');
    }

    const now = new Date();
    const row = await this.prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider: input.provider } },
      create: {
        userId,
        provider: input.provider,
        externalRef: input.externalRef,
        displayName: input.displayName ?? null,
        status: 'connected',
        syncType: input.syncType ?? 'manual',
        connectedAt: now,
        disconnectedAt: null,
      },
      update: {
        externalRef: input.externalRef,
        displayName: input.displayName ?? null,
        status: 'connected',
        syncType: input.syncType ?? 'manual',
        connectedAt: now,
        disconnectedAt: null,
      },
    });

    return this.toResponse(row);
  }

  async list(userId: string): Promise<UserIntegrationResponse[]> {
    const rows = await this.prisma.userIntegration.findMany({
      where: { userId },
      orderBy: { connectedAt: 'desc' },
    });
    return Promise.all(rows.map((row) => this.toResponse(row)));
  }

  async delete(userId: string, integrationId: string): Promise<void> {
    const row = await this.prisma.userIntegration.findFirst({
      where: { id: integrationId, userId },
    });
    if (row === null) {
      throw new NotFoundException('Integration not found');
    }

    if (row.provider === 'steam') {
      await this.steamConnect.disconnect(userId);
      return;
    }

    const now = new Date();
    await this.prisma.userIntegration.update({
      where: { id: row.id },
      data: { status: 'disconnected', disconnectedAt: now },
    });

    await this.prisma.activityItem.create({
      data: {
        kind: 'integration_disconnected',
        actorId: userId,
        objectType: 'user',
        objectId: row.id,
        occurredAt: now,
      },
    });
  }

  async listHistory(userId: string): Promise<SyncHistoryResponse[]> {
    const rows = await this.prisma.syncHistory.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    return rows.map(toSyncHistoryResponse);
  }

  async triggerSync(
    userId: string,
    integrationId: string,
    input: IntegrationSyncInput = {},
  ): Promise<SyncJobResponse> {
    const integration = await this.prisma.userIntegration.findFirst({
      where: { id: integrationId, userId, status: 'connected' },
    });
    if (integration === null) {
      throw new NotFoundException('Integration not found');
    }

    const syncType = input.syncType ?? 'manual';

    let job;
    try {
      job = await this.prisma.$transaction(
        async (tx) => {
          const activeJob = await tx.syncJob.findFirst({
            where: {
              userId,
              integrationId: integration.id,
              status: { in: ['pending', 'processing'] },
            },
          });
          if (activeJob !== null) {
            throw new ConflictException('Sync already running for this integration');
          }
          return tx.syncJob.create({
            data: {
              userId,
              integrationId: integration.id,
              provider: integration.provider,
              syncType,
              status: 'pending',
            },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      // P2034 = write conflict / deadlock on interactive transaction
      if (code === 'P2034') {
        throw new ConflictException('Sync already running for this integration');
      }
      throw error;
    }

    const bullJobId =
      this.jobsPublisher != null
        ? await this.jobsPublisher.enqueueSync({
            kind: 'sync',
            userId,
            integrationId: integration.id,
            syncJobId: job.id,
            syncType,
          })
        : null;

    if (bullJobId !== null) {
      await this.prisma.syncJob.update({
        where: { id: job.id },
        data: { bullJobId },
      });
      return toSyncJobResponse(job);
    }

    // No Redis / publisher — run inline for local / test continuity.
    await this.librarySync.runSync(job.id);
    const refreshed = await this.prisma.syncJob.findUnique({ where: { id: job.id } });
    if (refreshed === null) {
      throw new NotFoundException('Sync job not found');
    }
    return toSyncJobResponse(refreshed);
  }

  getSteamStatus(userId: string) {
    return this.steamConnect.status(userId);
  }

  getSteamProfile(userId: string) {
    return this.steamConnect.profile(userId);
  }

  private async toResponse(row: {
    id: string;
    provider: IntegrationProviderValue;
    externalRef: string;
    displayName: string | null;
    status: string;
    syncType: 'manual' | 'daily' | 'weekly' | 'monthly' | 'automatic';
    lastSyncAt: Date | null;
    connectedAt: Date;
  }): Promise<UserIntegrationResponse> {
    const [gamesImported, achievementsSynced] = await Promise.all([
      this.prisma.externalGame.count({ where: { integrationId: row.id } }),
      this.prisma.externalAchievement.count({ where: { integrationId: row.id } }),
    ]);
    return toUserIntegrationResponse(row, { gamesImported, achievementsSynced });
  }
}
