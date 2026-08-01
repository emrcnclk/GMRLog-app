import { describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('delegates health probes to HealthService', async () => {
    const healthService = {
      getHealth: vi.fn().mockReturnValue({ status: 'ok', version: '1.0.0' }),
      getLive: vi.fn().mockReturnValue({ status: 'ok' }),
      getReady: vi
        .fn()
        .mockResolvedValue({ status: 'ok', checks: { database: 'up', redis: 'up' } }),
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    expect(controller.getHealth()).toMatchObject({ status: 'ok' });
    expect(controller.getLive()).toMatchObject({ status: 'ok' });
    await expect(controller.getReady()).resolves.toMatchObject({ status: 'ok' });
  });
});
