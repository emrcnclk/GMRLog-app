#!/usr/bin/env node
/**
 * Measurement fixtures (3b.1f) — a repo-owned, reversible seed command.
 *
 * Decided 2026-08-08 against a fixture *tenant*: `empty` on the Circles
 * directory is a property of the database, not of a viewer — six public
 * circles are visible to everyone, so no account, however curated, ever sees
 * an empty list. Only mutating the database reaches that branch.
 *
 * Every state transition first reverts whatever this script created or
 * toggled last time, then applies the new one — so re-running with a
 * different state never leaves the previous run's rows behind, and the
 * database is never touched outside what this file itself recorded.
 *
 * Usage:
 *   pnpm fixture empty       — soft-delete every currently-readable community
 *   pnpm fixture populated   — add a handful of hand-written circles
 *   pnpm fixture edge        — add one long-name, image-less, minimal circle
 *   pnpm fixture reset       — revert to baseline, apply nothing
 *   pnpm fixture status      — show what is currently tracked
 *   pnpm fixture teardown <email>   — soft-delete a probe account, tracked for undo
 *   pnpm fixture restore <email|--all>  — undo one or all tracked account teardowns
 *
 * State lives in `scripts/dev/.fixture-state.json` (gitignored) — the record
 * this command reads before every revert, and the only thing it trusts to
 * know what it owns.
 */
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, '.fixture-state.json');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ??
        'postgresql://gmrlog:gmrlog@127.0.0.1:5433/gmrlog?schema=public',
    },
  },
});

function emptyState() {
  return {
    activeState: null,
    appliedAt: null,
    createdCommunityIds: [],
    createdOwnerUserIds: [],
    createdActivityItemIds: [],
    softDeletedCommunityIds: [],
    accountTeardowns: [],
  };
}

async function loadState() {
  try {
    const text = await readFile(STATE_PATH, 'utf8');
    return { ...emptyState(), ...JSON.parse(text) };
  } catch (error) {
    if (error.code === 'ENOENT') return emptyState();
    throw error;
  }
}

async function saveState(state) {
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function rand(len = 6) {
  return randomBytes(len).toString('hex');
}

/** Reverts exactly what the last directory-state run created or toggled. Never touches account teardowns — those are tracked and undone separately. */
async function revertDirectoryState(state) {
  for (const id of state.createdCommunityIds) {
    try {
      await prisma.community.delete({ where: { id } });
      console.log(`  reverted: deleted community ${id}`);
    } catch (error) {
      console.warn(`  could not delete community ${id}: ${error.message}`);
    }
  }
  // Deleting a community cascades its CommunityActivity join row but not the
  // ActivityItem it points to — tracked and deleted separately so a fixture
  // run never leaves an orphaned activity row behind.
  for (const id of state.createdActivityItemIds ?? []) {
    try {
      await prisma.activityItem.delete({ where: { id } });
      console.log(`  reverted: deleted activity item ${id}`);
    } catch (error) {
      console.warn(`  could not delete activity item ${id}: ${error.message}`);
    }
  }
  for (const id of state.createdOwnerUserIds) {
    try {
      await prisma.user.delete({ where: { id } });
      console.log(`  reverted: deleted probe owner ${id}`);
    } catch (error) {
      console.warn(`  could not delete probe owner ${id}: ${error.message}`);
    }
  }
  for (const id of state.softDeletedCommunityIds) {
    try {
      await prisma.community.update({ where: { id }, data: { deletedAt: null } });
      console.log(`  reverted: restored community ${id}`);
    } catch (error) {
      console.warn(`  could not restore community ${id}: ${error.message}`);
    }
  }
  state.activeState = null;
  state.appliedAt = null;
  state.createdCommunityIds = [];
  state.createdOwnerUserIds = [];
  state.createdActivityItemIds = [];
  state.softDeletedCommunityIds = [];
  return state;
}

async function createOwnedCommunity({ name, description, avatarKey, bannerKey, kind }) {
  const suffix = rand(4);
  const owner = await prisma.user.create({
    data: {
      handle: `fixture_owner_${suffix}`,
      displayName: `Fixture Owner ${suffix}`,
    },
  });
  const community = await prisma.community.create({
    data: {
      name,
      slug: `fixture-${suffix}-${rand(3)}`,
      description: description ?? null,
      visibility: 'public',
      joinType: 'public',
      avatarKey: avatarKey ?? null,
      bannerKey: bannerKey ?? null,
      // 3b.1e — falls back to the schema default ('games') when omitted, the
      // same backfill every pre-existing row got.
      ...(kind ? { kind } : {}),
    },
  });
  await prisma.communityMember.create({
    data: { communityId: community.id, userId: owner.id, role: 'owner' },
  });
  return { owner, community };
}

/**
 * 3b.1e — one post-kind activity item, right now, so `populated` demonstrates
 * a real `postsToday: 1` / `activeNow: true` row instead of every fixture
 * circle reading zero. Returns the created `ActivityItem` id so the caller
 * can track it for revert (deleting a community cascades the `CommunityActivity`
 * join row, not the `ActivityItem` it points to).
 */
async function postActivityNow(communityId, actorUserId) {
  const activityItem = await prisma.activityItem.create({
    data: {
      kind: 'post',
      actorId: actorUserId,
      objectType: 'post',
      objectId: `fixture-post-${rand(4)}`,
      occurredAt: new Date(),
    },
  });
  await prisma.communityActivity.create({
    data: { communityId, activityItemId: activityItem.id },
  });
  return activityItem.id;
}

async function applyEmpty(state) {
  const readable = await prisma.community.findMany({
    where: { deletedAt: null, members: { some: { role: 'owner' } } },
    select: { id: true, name: true },
  });
  for (const row of readable) {
    await prisma.community.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    state.softDeletedCommunityIds.push(row.id);
    console.log(`  hid: ${row.name} (${row.id})`);
  }
  console.log(`empty: ${readable.length} readable circle(s) hidden. Directory now serves zero.`);
}

const POPULATED_ROWS = [
  {
    name: 'Speedrun Society',
    description: 'Any% and category extension runs, weekly.',
    kind: 'games',
    postActiveNow: true,
  },
  {
    name: 'Tactics Table',
    description: 'Turn-based strategy, from Fire Emblem to XCOM.',
    kind: 'board_games',
  },
  { name: 'Cosplay Guild', description: null, kind: 'cosplay' },
  {
    name: 'Retro Arcade Club',
    description: 'Cabinets, carts and the games that started it.',
    kind: 'live_events',
  },
];

async function applyPopulated(state) {
  for (const row of POPULATED_ROWS) {
    const { owner, community } = await createOwnedCommunity(row);
    state.createdOwnerUserIds.push(owner.id);
    state.createdCommunityIds.push(community.id);
    console.log(`  created: ${community.name} (${community.id}) — ${community.kind}`);
    if (row.postActiveNow) {
      const activityItemId = await postActivityNow(community.id, owner.id);
      state.createdActivityItemIds.push(activityItemId);
      console.log(`    + post-kind activity now — postsToday: 1, activeNow: true`);
    }
  }
  console.log(`populated: ${POPULATED_ROWS.length} hand-written circle(s) added.`);
}

async function applyEdge(state) {
  const longName =
    'The Absolutely Definitely Not Abbreviated Long-Format Discussion and Appreciation Circle for Games Nobody Else Plays';
  const { owner, community } = await createOwnedCommunity({
    name: longName,
    description: null,
    avatarKey: null,
    bannerKey: null,
  });
  state.createdOwnerUserIds.push(owner.id);
  state.createdCommunityIds.push(community.id);
  console.log(`  created: "${longName}" (${community.id})`);
  console.log(
    'edge: one circle added — max-length name, no avatar/banner, member count at its floor.\n' +
      "  Deviation: a literal zero member count is unreachable — 'listPublic'/" +
      "'listDiscoverableForMemberCommunityIds' both require an owner membership row\n" +
      '  (HAS_OWNER, community.repository.ts) for a community to be readable at all,\n' +
      '  so 1 (owner only) is the floor, not 0. That is the count this row renders.',
  );
}

async function cmdDirectoryState(target) {
  const state = await loadState();
  if (state.activeState !== null) {
    console.log(`Reverting previous state: ${state.activeState}`);
  }
  await revertDirectoryState(state);

  if (target === 'empty') await applyEmpty(state);
  else if (target === 'populated') await applyPopulated(state);
  else if (target === 'edge') await applyEdge(state);
  else throw new Error(`unknown state: ${target}`);

  state.activeState = target;
  state.appliedAt = new Date().toISOString();
  await saveState(state);
  console.log(`\nState is now: ${target}`);
}

async function cmdReset() {
  const state = await loadState();
  if (state.activeState === null) {
    console.log('Already at baseline — nothing to revert.');
    return;
  }
  console.log(`Reverting: ${state.activeState}`);
  await revertDirectoryState(state);
  await saveState(state);
  console.log('State is now: baseline.');
}

async function cmdStatus() {
  const state = await loadState();
  console.log(JSON.stringify(state, null, 2));
}

async function cmdTeardown(email) {
  if (!email) throw new Error('usage: pnpm fixture teardown <email>');
  const credential = await prisma.authCredential.findFirst({
    where: { type: 'password', providerRef: email },
    select: { userId: true },
  });
  if (!credential) throw new Error(`no password credential found for ${email}`);
  const user = await prisma.user.findUnique({ where: { id: credential.userId } });
  if (!user) throw new Error(`credential points at a missing user (${credential.userId})`);
  if (user.deletedAt !== null) {
    console.log(`${email} (${user.id}) is already soft-deleted.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });
  const state = await loadState();
  state.accountTeardowns.push({
    id: user.id,
    handle: user.handle,
    email,
    teardownAt: new Date().toISOString(),
  });
  await saveState(state);
  console.log(`Soft-deleted ${email} → @${user.handle} (${user.id}). Tracked for restore.`);
}

async function cmdRestore(target) {
  if (!target) throw new Error('usage: pnpm fixture restore <email|--all>');
  const state = await loadState();
  const toRestore =
    target === '--all'
      ? state.accountTeardowns
      : state.accountTeardowns.filter((entry) => entry.email === target);
  if (toRestore.length === 0) {
    console.log(`No tracked teardown matches ${target}.`);
    return;
  }
  for (const entry of toRestore) {
    await prisma.user.update({ where: { id: entry.id }, data: { deletedAt: null } });
    console.log(`Restored ${entry.email} → @${entry.handle} (${entry.id}).`);
  }
  state.accountTeardowns = state.accountTeardowns.filter((entry) => !toRestore.includes(entry));
  await saveState(state);
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  try {
    switch (command) {
      case 'empty':
      case 'populated':
      case 'edge':
        await cmdDirectoryState(command);
        break;
      case 'reset':
        await cmdReset();
        break;
      case 'status':
        await cmdStatus();
        break;
      case 'teardown':
        await cmdTeardown(arg);
        break;
      case 'restore':
        await cmdRestore(arg);
        break;
      default:
        console.error(
          'usage: pnpm fixture <empty|populated|edge|reset|status|teardown <email>|restore <email|--all>>',
        );
        process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
