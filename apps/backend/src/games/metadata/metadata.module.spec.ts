import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { JobsService } from '../../infrastructure/jobs/jobs.service';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { MetadataModule } from './metadata.module';

/**
 * Regression test for a real production incident hit while smoke-testing
 * D3.25: `GameMetadataPublisher`'s constructor declared
 * `@Optional() private readonly jobs: JobsService | null`. TypeScript erases a
 * `T | null` union to `Object` in the `design:paramtypes` metadata Nest reads
 * for constructor injection, so Nest could not resolve the token — even
 * though `MetadataModule` always imports `JobsModule` and `JobsService` is
 * never actually absent in a real deployment. The result: every catalog
 * enrichment enqueue silently no-op'd in the running worker (logged
 * `game.metadata.enqueue.unavailable`), verified live against Postgres/Redis
 * before the fix, not caught by any manually-constructed unit test because
 * those always pass `jobs` explicitly and never exercise Nest's own
 * reflection-based resolution.
 *
 * This test boots the real module graph (no HTTP, no live DB/Redis
 * connection — both `PrismaModule` and `JobsModule`'s Redis client are lazy)
 * and asserts the publisher actually receives a `JobsService` instance.
 */
describe('MetadataModule DI wiring', () => {
  it('resolves a real JobsService into GameMetadataPublisher through the actual module graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MetadataModule],
    }).compile();

    const publisher = moduleRef.get(GameMetadataPublisher);
    const jobs = moduleRef.get(JobsService);

    expect((publisher as unknown as { jobs: unknown }).jobs).toBe(jobs);
    expect((publisher as unknown as { jobs: unknown }).jobs).not.toBeNull();

    await moduleRef.close();
  });
});
