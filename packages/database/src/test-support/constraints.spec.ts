import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createGame, createUser } from './factories';
import { createTestDatabase, type TestDatabase } from './db-harness';

let db: TestDatabase;

beforeAll(async () => {
  db = await createTestDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('unique constraints (S2 §11)', () => {
  it('enforces one library relationship per (userId, gameId)', async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const data = {
      user: { connect: { id: user.id } },
      game: { connect: { id: game.id } },
      status: 'owned' as const,
      source: 'manual' as const,
    };
    await db.prisma.libraryEntry.create({ data });
    await expect(db.prisma.libraryEntry.create({ data })).rejects.toThrow();
  });

  it('enforces one follow per direction', async () => {
    const a = await createUser(db.prisma);
    const b = await createUser(db.prisma);
    const data = { follower: { connect: { id: a.id } }, followee: { connect: { id: b.id } } };
    await db.prisma.follow.create({ data });
    await expect(db.prisma.follow.create({ data })).rejects.toThrow();
  });

  it('enforces one connected account per (userId, provider)', async () => {
    const user = await createUser(db.prisma);
    const data = {
      user: { connect: { id: user.id } },
      provider: 'discord' as const,
      status: 'connected' as const,
    };
    await db.prisma.connectedAccount.create({ data });
    await expect(db.prisma.connectedAccount.create({ data })).rejects.toThrow();
  });

  it('enforces one reaction per (actor, target, kind)', async () => {
    const actor = await createUser(db.prisma);
    const data = {
      actor: { connect: { id: actor.id } },
      targetType: 'post' as const,
      targetId: 'post-9',
      kind: 'like',
    };
    await db.prisma.reaction.create({ data });
    await expect(db.prisma.reaction.create({ data })).rejects.toThrow();
  });

  it('enforces unique slugs / handles', async () => {
    await createUser(db.prisma, { handle: 'duplicate' });
    await expect(createUser(db.prisma, { handle: 'duplicate' })).rejects.toThrow();
  });
});

describe('foreign key constraints (S2 §12)', () => {
  it('rejects a Review referencing a non-existent game', async () => {
    const author = await createUser(db.prisma);
    await expect(
      db.prisma.review.create({
        data: {
          author: { connect: { id: author.id } },
          game: { connect: { id: 'does-not-exist' } },
          rating: 5,
          visibility: 'public',
        },
      }),
    ).rejects.toThrow();
  });

  it('protects authored content from silent hard purge on user delete (Restrict)', async () => {
    const author = await createUser(db.prisma);
    await db.prisma.post.create({
      data: { author: { connect: { id: author.id } }, body: 'keep me', visibility: 'public' },
    });
    // User account removal is policy-gated (S2 §13) — the FK refuses a silent cascade.
    await expect(db.prisma.user.delete({ where: { id: author.id } })).rejects.toThrow();
  });
});

describe('enum integrity (S2 §12/§14)', () => {
  it('rejects a value outside the closed enum set at the database boundary', async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    // Raw insert bypasses the type layer to prove the DB enum is the last line of integrity.
    await expect(
      db.prisma.$executeRawUnsafe(
        `INSERT INTO "library_entries" ("id","user_id","game_id","status","source","version","created_at","updated_at")
         VALUES ('le_bad', $1, $2, 'not_a_status', 'manual', 0, now(), now())`,
        user.id,
        game.id,
      ),
    ).rejects.toThrow();
  });
});
