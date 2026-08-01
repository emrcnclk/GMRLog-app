import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../logging/app-logger.service';
import { parseBackendEnv } from '../config/env.schema';

import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  it('revokes and deletes expired sessions', async () => {
    const sessions = {
      revokeExpiredBefore: vi.fn().mockResolvedValue(2),
      deleteRevokedOrExpiredBefore: vi.fn().mockResolvedValue(3),
    };
    const notifications = {
      deleteReadOlderThan: vi.fn(),
    };
    const prisma = {} as never;
    const logger = new AppLogger(parseBackendEnv({}));
    const service = new MaintenanceService(prisma, logger);

    Object.assign(service as object, {
      sessions,
      notifications,
    });

    await service.runSessionCleanup();
    expect(sessions.revokeExpiredBefore).toHaveBeenCalledOnce();
    expect(sessions.deleteRevokedOrExpiredBefore).toHaveBeenCalledOnce();
  });

  it('rethrows cleanup failures after logging', async () => {
    const sessions = {
      revokeExpiredBefore: vi.fn().mockRejectedValue(new Error('db down')),
      deleteRevokedOrExpiredBefore: vi.fn(),
    };
    const prisma = {} as never;
    const logger = new AppLogger(parseBackendEnv({}));
    const service = new MaintenanceService(prisma, logger);
    Object.assign(service as object, { sessions });

    await expect(service.runSessionCleanup()).rejects.toThrow('db down');
  });
});
