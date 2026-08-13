import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SteamConnectService } from './steam-connect.service';
import { MockSteamWebApiClient } from './steam/steam-web-api.client';

function createPrismaMock() {
  const integrations = new Map<
    string,
    {
      id: string;
      userId: string;
      provider: 'steam';
      externalRef: string;
      displayName: string | null;
      status: string;
      syncType: 'manual';
      lastSyncAt: Date | null;
      connectedAt: Date;
      disconnectedAt: Date | null;
      metadata: unknown;
    }
  >();
  const profiles = new Map<
    string,
    {
      id: string;
      userId: string;
      integrationId: string;
      provider: 'steam';
      externalId: string;
      vanityUrl: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      profileUrl: string | null;
    }
  >();
  let seq = 0;

  return {
    integrations,
    profiles,
    prisma: {
      userIntegration: {
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          for (const row of integrations.values()) {
            if (
              where['provider'] === row.provider &&
              where['externalRef'] === row.externalRef &&
              where['status'] === row.status &&
              (where as { NOT?: { userId: string } }).NOT?.userId !== row.userId
            ) {
              return row;
            }
          }
          return null;
        }),
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { userId_provider?: { userId: string; provider: string }; id?: string };
          }) => {
            if (where.userId_provider !== undefined) {
              return (
                [...integrations.values()].find(
                  (row) =>
                    row.userId === where.userId_provider?.userId &&
                    row.provider === where.userId_provider.provider,
                ) ?? null
              );
            }
            return where.id !== undefined ? (integrations.get(where.id) ?? null) : null;
          },
        ),
        upsert: vi.fn(
          async ({
            where,
            create,
            update,
          }: {
            where: { userId_provider: { userId: string; provider: string } };
            create: Record<string, unknown>;
            update: Record<string, unknown>;
          }) => {
            const existing = [...integrations.values()].find(
              (row) =>
                row.userId === where.userId_provider.userId &&
                row.provider === where.userId_provider.provider,
            );
            if (existing !== undefined) {
              Object.assign(existing, update);
              return existing;
            }
            seq += 1;
            const row = {
              id: `int-${String(seq)}`,
              userId: where.userId_provider.userId,
              provider: 'steam' as const,
              externalRef: String(create['externalRef']),
              displayName: (create['displayName'] as string | null) ?? null,
              status: String(create['status']),
              syncType: 'manual' as const,
              lastSyncAt: null,
              connectedAt: (create['connectedAt'] as Date) ?? new Date(),
              disconnectedAt: null,
              metadata: create['metadata'] ?? null,
            };
            integrations.set(row.id, row);
            return row;
          },
        ),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const row = integrations.get(where.id);
            if (row === undefined) {
              throw new Error('missing');
            }
            Object.assign(row, data);
            return row;
          },
        ),
      },
      externalProfile: {
        // Keyed by (provider, externalId) like the real unique constraint, so a
        // reconnect reuses the row instead of creating a second profile.
        upsert: vi.fn(
          async ({
            where,
            create,
            update,
          }: {
            where: { provider_externalId: { provider: string; externalId: string } };
            create: Record<string, unknown>;
            update: Record<string, unknown>;
          }) => {
            const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
            const existing = profiles.get(key);
            if (existing !== undefined) {
              for (const [field, value] of Object.entries(update)) {
                if (value !== undefined) {
                  (existing as Record<string, unknown>)[field] = value;
                }
              }
              return existing;
            }
            const row = {
              id: `prof-${key}`,
              userId: String(create['userId']),
              integrationId: String(create['integrationId']),
              provider: where.provider_externalId.provider,
              externalId: where.provider_externalId.externalId,
              vanityUrl: (create['vanityUrl'] as string | null) ?? null,
              displayName: (create['displayName'] as string | null) ?? null,
              avatarUrl: (create['avatarUrl'] as string | null) ?? null,
              profileUrl: (create['profileUrl'] as string | null) ?? null,
            };
            profiles.set(key, row as never);
            return row;
          },
        ),
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: {
              integrationId?: string;
              provider_externalId?: { provider: string; externalId: string };
            };
          }) => {
            if (where.provider_externalId !== undefined) {
              const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
              return profiles.get(key) ?? null;
            }
            for (const row of profiles.values()) {
              if (row['integrationId'] === where.integrationId) {
                return row;
              }
            }
            return null;
          },
        ),
      },
      connectedAccount: {
        upsert: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      accountLink: {
        create: vi.fn(async () => ({})),
      },
      activityItem: {
        create: vi.fn(async () => ({})),
      },
      externalGame: {
        count: vi.fn(async () => 0),
      },
      externalAchievement: {
        count: vi.fn(async () => 0),
      },
    },
  };
}

describe('SteamConnectService', () => {
  let steam: MockSteamWebApiClient;
  let prisma: ReturnType<typeof createPrismaMock>['prisma'];
  let integrations: ReturnType<typeof createPrismaMock>['integrations'];
  let service: SteamConnectService;

  beforeEach(() => {
    steam = new MockSteamWebApiClient();
    const mock = createPrismaMock();
    prisma = mock.prisma;
    integrations = mock.integrations;
    service = new SteamConnectService(prisma as never, steam);
  });

  it('connects with SteamID64 and creates integration', async () => {
    const result = await service.connect('user-1', {
      steamIdOrUrl: steam.fixtures.steamId64,
    });
    expect(result.provider).toBe('steam');
    expect(result.externalRef).toBe(steam.fixtures.steamId64);
    expect(result.status).toBe('connected');
    expect(prisma.activityItem.create).toHaveBeenCalled();
  });

  it('connects via vanity URL through resolveVanity', async () => {
    const result = await service.connect('user-1', {
      steamIdOrUrl: 'https://steamcommunity.com/id/gmrlog_tester',
    });
    expect(result.externalRef).toBe(steam.fixtures.steamId64);
  });

  it('rejects invalid steam identity', async () => {
    await expect(service.connect('user-1', { steamIdOrUrl: '!!!' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects unresolved vanity', async () => {
    await expect(
      service.connect('user-1', { steamIdOrUrl: 'unknown_vanity_xyz' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects steam already linked to another user', async () => {
    await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
    await expect(
      service.connect('user-2', { steamIdOrUrl: steam.fixtures.steamId64 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns disconnected status when missing', async () => {
    const status = await service.status('user-1');
    expect(status.connected).toBe(false);
    expect(status.integration).toBeNull();
  });

  it('disconnects an existing steam link', async () => {
    await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
    await service.disconnect('user-1');
    const status = await service.status('user-1');
    expect(status.connected).toBe(false);
    expect([...integrations.values()][0]?.status).toBe('disconnected');
  });

  it('profile returns external projection after connect', async () => {
    await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
    const profile = await service.profile('user-1');
    expect(profile.steamId).toBe(steam.fixtures.steamId64);
    expect(profile.displayName).toBe('GMRLOG Tester');
  });

  it('profile throws when not connected', async () => {
    await expect(service.profile('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('connectVerified (task 4.5 — OpenID-verified path)', () => {
    it('connects an already-proven SteamID64 directly, with no parsing/vanity step', async () => {
      const result = await service.connectVerified('user-1', steam.fixtures.steamId64);
      expect(result.externalRef).toBe(steam.fixtures.steamId64);
      expect(result.status).toBe('connected');
    });

    it('writes an AccountLink(purpose: connect) audit row — connect() never does', async () => {
      await service.connectVerified('user-1', steam.fixtures.steamId64);
      expect(prisma.accountLink.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: 'user-1' } },
          provider: 'steam',
          purpose: 'connect',
          status: 'completed',
        },
      });

      await service.connect('user-2', { steamIdOrUrl: '7656119' + '9'.repeat(10) });
      expect(prisma.accountLink.create).toHaveBeenCalledTimes(1);
    });

    it('still rejects a SteamID already linked to another user when verified', async () => {
      await service.connectVerified('user-1', steam.fixtures.steamId64);
      await expect(
        service.connectVerified('user-2', steam.fixtures.steamId64),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('is idempotent: re-verifying the same user/SteamID updates rather than duplicates', async () => {
      await service.connectVerified('user-1', steam.fixtures.steamId64);
      await service.connectVerified('user-1', steam.fixtures.steamId64);
      expect(integrations.size).toBe(1);
    });

    it('a manual connect() followed by disconnect() and a verified reconnect both leave one row, one active', async () => {
      await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
      await service.disconnect('user-1');
      const result = await service.connectVerified('user-1', steam.fixtures.steamId64);
      expect(result.status).toBe('connected');
      expect(integrations.size).toBe(1);
    });

    it('marks a verified connection with a durable verified flag', async () => {
      const result = await service.connectVerified('user-1', steam.fixtures.steamId64);
      expect(result.verified).toBe(true);
    });

    it('marks a self-reported connect() as unverified', async () => {
      const result = await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
      expect(result.verified).toBe(false);
    });

    describe('task 4.5a — squatted unverified claim never blocks the real owner', () => {
      it("evicts a squatter's unverified connect() when the real owner verifies via OpenID", async () => {
        await service.connect('user-2-squatter', { steamIdOrUrl: steam.fixtures.steamId64 });

        const result = await service.connectVerified('user-1-real-owner', steam.fixtures.steamId64);

        expect(result.status).toBe('connected');
        expect(result.externalRef).toBe(steam.fixtures.steamId64);

        const squatterStatus = await service.status('user-2-squatter');
        expect(squatterStatus.connected).toBe(false);

        const ownerStatus = await service.status('user-1-real-owner');
        expect(ownerStatus.connected).toBe(true);
        expect(ownerStatus.integration?.verified).toBe(true);
      });

      it('still rejects a second unverified connect() attempt against an existing unverified claim', async () => {
        await service.connect('user-2-squatter', { steamIdOrUrl: steam.fixtures.steamId64 });
        await expect(
          service.connect('user-3-also-unverified', { steamIdOrUrl: steam.fixtures.steamId64 }),
        ).rejects.toBeInstanceOf(ConflictException);
      });

      it('still rejects a verified attempt against an already-verified claim by someone else', async () => {
        await service.connectVerified('user-1-real-owner', steam.fixtures.steamId64);
        await expect(
          service.connectVerified('user-2-impersonator', steam.fixtures.steamId64),
        ).rejects.toBeInstanceOf(ConflictException);
      });
    });

    it('has no path from unverified to verified other than passing OpenID verification', async () => {
      // connect() is the only write path with no proof of ownership; it must
      // never itself flip an existing connection's verified flag to true.
      await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
      await service.connect('user-1', { steamIdOrUrl: steam.fixtures.steamId64 });
      const status = await service.status('user-1');
      expect(status.integration?.verified).toBe(false);
    });
  });
});
