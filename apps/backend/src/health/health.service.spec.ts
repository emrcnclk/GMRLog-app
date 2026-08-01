import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthService } from './health.service';

describe('HealthService', () => {
  const env = {
    APP_VERSION: '1.2.3',
    APP_ENV: 'development' as const,
    MEILI_HOST: 'http://127.0.0.1:7700',
    S3_ENDPOINT: 'http://127.0.0.1:9000',
  };
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> };
  let redis: { status: string; connect: ReturnType<typeof vi.fn>; ping: ReturnType<typeof vi.fn> };
  let storage: { ping: ReturnType<typeof vi.fn> } | null;
  let meili: { isAvailable: ReturnType<typeof vi.fn>; health: ReturnType<typeof vi.fn> } | null;
  let service: HealthService;

  beforeEach(() => {
    prisma = { $queryRaw: vi.fn() };
    redis = {
      status: 'ready',
      connect: vi.fn(),
      ping: vi.fn().mockResolvedValue('PONG'),
    };
    storage = { ping: vi.fn().mockResolvedValue(true) };
    meili = {
      isAvailable: vi.fn().mockReturnValue(true),
      health: vi.fn().mockResolvedValue(true),
    };
    service = new HealthService(
      env as never,
      prisma as never,
      redis as never,
      storage as never,
      meili as never,
    );
  });

  it('returns the aggregate health report', () => {
    const report = service.getHealth();
    expect(report.status).toBe('ok');
    expect(report.version).toBe('1.2.3');
    expect(report.environment).toBe('development');
    expect(report.uptimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns a live probe without dependency checks', () => {
    expect(service.getLive()).toMatchObject({ status: 'ok' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns ready when database and redis are up', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const report = await service.getReady();
    expect(report).toMatchObject({
      status: 'ok',
      checks: { database: 'up', redis: 'up', storage: 'up', meili: 'up' },
    });
  });

  it('throws 503 when a dependency is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('throws 503 when configured storage or meili is down', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.status = 'wait';
    storage = { ping: vi.fn().mockResolvedValue(false) };
    meili = {
      isAvailable: vi.fn().mockReturnValue(true),
      health: vi.fn().mockResolvedValue(false),
    };
    service = new HealthService(
      env as never,
      prisma as never,
      redis as never,
      storage as never,
      meili as never,
    );
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(redis.connect).toHaveBeenCalledOnce();
  });
  it('returns ready when wait-state redis connects and integrations are up', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.status = 'wait';
    const report = await service.getReady();
    expect(report.status).toBe('ok');
    expect(report.checks).toMatchObject({
      database: 'up',
      redis: 'up',
      storage: 'up',
      meili: 'up',
    });
    expect(redis.connect).toHaveBeenCalledOnce();
  });
  it('marks storage down via ping exception', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    storage = { ping: vi.fn().mockRejectedValue(new Error('minio down')) };
    service = new HealthService(
      env as never,
      prisma as never,
      redis as never,
      storage as never,
      meili as never,
    );
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('marks meili down via health exception', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    meili = {
      isAvailable: vi.fn().mockReturnValue(true),
      health: vi.fn().mockRejectedValue(new Error('meili down')),
    };
    service = new HealthService(
      env as never,
      prisma as never,
      redis as never,
      storage as never,
      meili as never,
    );
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('omits optional checks when integrations are not mounted', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    service = new HealthService(
      { ...env, MEILI_HOST: '', S3_ENDPOINT: '' } as never,
      prisma as never,
      redis as never,
      null,
      null,
    );
    const report = await service.getReady();
    expect(report.checks.storage).toBeUndefined();
    expect(report.checks.meili).toBeUndefined();
  });
  it('marks configured meili down when client is missing', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    service = new HealthService(
      env as never,
      prisma as never,
      redis as never,
      storage as never,
      null,
    );
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('marks redis down when ping fails', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockRejectedValue(new Error('redis down'));
    await expect(service.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
