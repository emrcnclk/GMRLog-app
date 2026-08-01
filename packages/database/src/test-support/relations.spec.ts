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

describe('cascade policy (S2 §13) — structural children cascade with their root', () => {
  it('deleting a LibraryEntry cascades its GameLog rows', async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const entry = await db.prisma.libraryEntry.create({
      data: {
        user: { connect: { id: user.id } },
        game: { connect: { id: game.id } },
        status: 'playing',
        source: 'manual',
        logs: { create: [{ kind: 'session', occurredAt: new Date() }] },
      },
    });

    expect(await db.prisma.gameLog.count({ where: { libraryEntryId: entry.id } })).toBe(1);
    await db.prisma.libraryEntry.delete({ where: { id: entry.id } });
    expect(await db.prisma.gameLog.count({ where: { libraryEntryId: entry.id } })).toBe(0);
  });

  it('deleting a Collection cascades its CollectionEntry rows', async () => {
    const owner = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const collection = await db.prisma.collection.create({
      data: {
        owner: { connect: { id: owner.id } },
        title: 'Faves',
        visibility: 'public',
        entries: { create: [{ game: { connect: { id: game.id } }, position: 0 }] },
      },
    });

    await db.prisma.collection.delete({ where: { id: collection.id } });
    expect(await db.prisma.collectionEntry.count({ where: { collectionId: collection.id } })).toBe(
      0,
    );
  });

  it('deleting a TierList cascades slots and their games', async () => {
    const owner = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const tierList = await db.prisma.tierList.create({
      data: {
        owner: { connect: { id: owner.id } },
        title: 'S Tier',
        visibility: 'public',
        slots: {
          create: [
            {
              label: 'S',
              position: 0,
              games: { create: [{ game: { connect: { id: game.id } }, position: 0 }] },
            },
          ],
        },
      },
    });

    await db.prisma.tierList.delete({ where: { id: tierList.id } });
    expect(await db.prisma.tierSlot.count({ where: { tierListId: tierList.id } })).toBe(0);
    expect(await db.prisma.tierSlotGame.count()).toBe(0);
  });

  it('deleting an ImportJob cascades its ImportItem rows', async () => {
    const user = await createUser(db.prisma);
    const job = await db.prisma.importJob.create({
      data: {
        user: { connect: { id: user.id } },
        provider: 'steam',
        status: 'processing',
        items: { create: [{ externalRef: 'app/1' }] },
      },
    });

    await db.prisma.importJob.delete({ where: { id: job.id } });
    expect(await db.prisma.importItem.count({ where: { importJobId: job.id } })).toBe(0);
  });

  it('deleting a User cascades infra rows (Session) — join/state honesty', async () => {
    const user = await createUser(db.prisma);
    await db.prisma.session.create({
      data: { user: { connect: { id: user.id } }, expiresAt: new Date(Date.now() + 60_000) },
    });

    await db.prisma.user.delete({ where: { id: user.id } });
    expect(await db.prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe('relation integrity', () => {
  it('links Report → ModerationCase as 1 → 0..1 (unique reportId)', async () => {
    const reporter = await createUser(db.prisma);
    const report = await db.prisma.report.create({
      data: {
        reporter: { connect: { id: reporter.id } },
        targetType: 'post',
        targetId: 'post-1',
        reason: 'spam',
        status: 'open',
      },
    });
    const moderation = await db.prisma.moderationCase.create({
      data: {
        report: { connect: { id: report.id } },
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      },
    });

    const withCase = await db.prisma.report.findUnique({
      where: { id: report.id },
      include: { moderationCase: true },
    });
    expect(withCase?.moderationCase?.id).toBe(moderation.id);
  });

  it('supports self-referential Comment replies', async () => {
    const author = await createUser(db.prisma);
    const parent = await db.prisma.comment.create({
      data: {
        author: { connect: { id: author.id } },
        hostType: 'post',
        hostId: 'p1',
        body: 'root',
      },
    });
    const reply = await db.prisma.comment.create({
      data: {
        author: { connect: { id: author.id } },
        hostType: 'post',
        hostId: 'p1',
        body: 'child',
        parent: { connect: { id: parent.id } },
      },
    });

    const withReplies = await db.prisma.comment.findUnique({
      where: { id: parent.id },
      include: { replies: true },
    });
    expect(withReplies?.replies.map((r) => r.id)).toEqual([reply.id]);
  });
});
