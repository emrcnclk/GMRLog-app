#!/usr/bin/env node
/**
 * D3.25 — real 50-game enrichment validation.
 *
 * Ground truth discovered during validation: of the 1056 rows in the dev
 * catalog, 999 are "Mock Game NNNN" (Steam stress-test fixtures), 50 are
 * "Perf Game N" (performance-test fixtures), 2 are "Smoke Catalog Game ..."
 * (smoke-test fixtures), and only 5 are real, recognizable titles (already
 * enriched: Hades, Portal 2, Celeste, Hollow Knight, Elden Ring). There are
 * not 50 real games sitting in the catalog to select from.
 *
 * This script creates 50 real, well-known game titles as skeleton rows using
 * the identical shape `library-sync.resolveOrCreateGame` produces (title +
 * slug only — no other columns touched), then enqueues each through the real
 * `game.metadata.enrich` BullMQ job so the already-running worker processes
 * them with real IGDB/Steam network calls. No mock data, no fake responses —
 * only the *input list* is curated, because the catalog had nothing real
 * left unenriched to pick from.
 */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { config as loadEnv } from 'dotenv';
import IORedis from 'ioredis';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const REAL_GAMES = [
  'The Witcher 3: Wild Hunt',
  'Red Dead Redemption 2',
  'Grand Theft Auto V',
  'The Legend of Zelda: Breath of the Wild',
  'Dark Souls III',
  'Sekiro: Shadows Die Twice',
  'Bloodborne',
  'Cyberpunk 2077',
  'Disco Elysium',
  'Outer Wilds',
  'Stardew Valley',
  'Terraria',
  'Minecraft',
  'Half-Life 2',
  'Half-Life: Alyx',
  'Counter-Strike 2',
  'Dota 2',
  "Baldur's Gate 3",
  'Divinity: Original Sin 2',
  'Persona 5 Royal',
  'Nier: Automata',
  'God of War',
  'Death Stranding',
  'Control',
  'Resident Evil 4',
  'Resident Evil Village',
  'Monster Hunter: World',
  'Doom Eternal',
  'Titanfall 2',
  'Apex Legends',
  'Overwatch 2',
  'Valorant',
  'League of Legends',
  'World of Warcraft',
  'Diablo IV',
  'Path of Exile',
  'Slay the Spire',
  'Hades II',
  'Ori and the Blind Forest',
  'Ori and the Will of the Wisps',
  'Cuphead',
  'Undertale',
  'Deltarune',
  'Return of the Obra Dinn',
  'Subnautica',
  "No Man's Sky",
  'Factorio',
  'Satisfactory',
  'Rimworld',
  'Kerbal Space Program',
];

function slugifyGameTitle(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug.length > 0 ? slug : 'game';
}

function toBullJobId(value) {
  return value.replaceAll(':', '-');
}

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const queue = new Queue('game.metadata', { connection });

const createdOrFound = [];

for (const title of REAL_GAMES) {
  const slug = slugifyGameTitle(title);
  let game = await prisma.game.findUnique({ where: { slug } });
  if (game === null) {
    game = await prisma.game.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
    });
  }
  if (game === null) {
    game = await prisma.game.create({ data: { title, slug } });
    console.log(`CREATED  ${game.id}  ${title}`);
  } else {
    console.log(`EXISTING ${game.id}  ${title}  (status=${game.metadataStatus})`);
  }
  createdOrFound.push(game);
}

console.log(`\nEnqueuing ${createdOrFound.length} real enrichment jobs (reason=manual)...`);

let enqueued = 0;
for (const game of createdOrFound) {
  const idempotencyKey = `game.metadata:enrich:${game.id}:manual`;
  const jobId = toBullJobId(idempotencyKey);
  await queue.add(
    'game.metadata.enrich',
    {
      schemaVersion: 1,
      correlationId: randomUUID(),
      idempotencyKey,
      enqueuedAt: new Date().toISOString(),
      data: { gameId: game.id, reason: 'manual' },
    },
    {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: false,
    },
  );
  enqueued += 1;
}

console.log(`Enqueued ${enqueued}/${createdOrFound.length} jobs.`);
console.log(createdOrFound.map((g) => g.id).join('\n'));

await queue.close();
await connection.quit();
await prisma.$disconnect();
