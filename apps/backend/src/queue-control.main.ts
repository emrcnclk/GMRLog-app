import 'reflect-metadata';

import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import {
  QUEUE_GAME_CATALOG_SYNC,
  QUEUE_GAME_MEDIA,
  QUEUE_GAME_METADATA,
} from './infrastructure/jobs/queue-names';

loadBackendDotenv();

/**
 * Only the catalog queues. Pausing a maintenance or notification queue from an
 * operator shell is a different kind of decision, and nothing that needs it
 * exists yet — a queue name outside this list is refused rather than guessed.
 */
const CONTROLLABLE = [QUEUE_GAME_METADATA, QUEUE_GAME_MEDIA, QUEUE_GAME_CATALOG_SYNC] as const;
type ControllableQueue = (typeof CONTROLLABLE)[number];

const ACTIONS = ['status', 'pause', 'resume'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * `pnpm --filter backend run queue:control -- <status|pause|resume> <queue>`
 *
 * The reversible switch the catalog bootstrap needs (PRODUCTION_DEPLOY.md,
 * "First-time catalog bootstrap"). Pausing moves waiting jobs aside without
 * deleting a single one; `resume` puts them back in order. Workers stop
 * taking new jobs from a paused queue and finish the ones already active.
 *
 * Why it exists: re-fetching an igdbId the catalog already has routes it to an
 * enrich job, and the enrich path enqueues media unfiltered — up to eighteen
 * images a game, twelve of them screenshots. A full catalog walk produced
 * 56,547 such jobs locally; run unpaused they would have queued roughly half a
 * million downloads nobody asked for.
 */
async function bootstrap(): Promise<void> {
  const action = process.argv[2] as Action | undefined;
  const name = process.argv[3] as ControllableQueue | undefined;

  if (
    action === undefined ||
    !ACTIONS.includes(action) ||
    name === undefined ||
    !CONTROLLABLE.includes(name)
  ) {
    console.error(
      `Usage: queue-control.main.js <${ACTIONS.join('|')}> <${CONTROLLABLE.join('|')}>`,
    );
    process.exitCode = 1;
    return;
  }

  const url = process.env.REDIS_URL;
  if (url === undefined || url.length === 0) {
    console.error('REDIS_URL is not set.');
    process.exitCode = 1;
    return;
  }

  // Built exactly the way `JobsModule` builds the app's own connection, so
  // this reaches the same Redis the workers do, with the options BullMQ
  // requires of a shared connection.
  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  const queue = new Queue(name, { connection });
  try {
    if (action === 'pause') {
      await queue.pause();
    } else if (action === 'resume') {
      await queue.resume();
    }
    const counts = await queue.getJobCounts('waiting', 'active', 'paused', 'delayed', 'failed');
    console.log(
      `${name}  paused=${String(await queue.isPaused())}  ${Object.entries(counts)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join('  ')}`,
    );
  } finally {
    await queue.close();
    connection.disconnect();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
