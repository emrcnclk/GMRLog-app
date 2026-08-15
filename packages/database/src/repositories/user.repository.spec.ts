import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestDatabase } from '../test-support/db-harness';
import { PrismaUserRepository } from './user.repository';

let db: TestDatabase;

beforeAll(async () => {
  db = await createTestDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('PrismaUserRepository', () => {
  it('creates and reads a user by id and handle', async () => {
    const repo = new PrismaUserRepository(db.prisma);
    const created = await repo.create({ handle: 'ghost', displayName: 'Ghost' });

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(await repo.findById(created.id)).toMatchObject({ handle: 'ghost' });
    expect(await repo.findByHandle('ghost')).toMatchObject({ id: created.id });
  });

  it('soft-deletes without removing the row', async () => {
    const repo = new PrismaUserRepository(db.prisma);
    const user = await repo.create({ handle: 'faded', displayName: 'Faded' });

    const deleted = await repo.softDelete(user.id);
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(await repo.findById(user.id)).not.toBeNull();
  });

  it('9.5b: assigns a unique cardNumber on create, stable when another account is hard-deleted', async () => {
    const repo = new PrismaUserRepository(db.prisma);
    const before = await repo.create({ handle: 'before-serial', displayName: 'Before' });
    const target = await repo.create({ handle: 'target-serial', displayName: 'Target' });
    const after = await repo.create({ handle: 'after-serial', displayName: 'After' });

    expect(new Set([before.cardNumber, target.cardNumber, after.cardNumber]).size).toBe(3);

    // Deleting an account that was assigned a number ahead of `target` must
    // not renumber `target` — the whole point of a stored, not a live-COUNT,
    // serial.
    await repo.delete(before.id);

    const targetAfterDeletion = await repo.findById(target.id);
    expect(targetAfterDeletion?.cardNumber).toBe(target.cardNumber);
  });

  it('9.5b: an organisation account still gets a cardNumber — no gating by accountKind', async () => {
    const repo = new PrismaUserRepository(db.prisma);
    const org = await repo.create({
      handle: 'org-serial',
      displayName: 'Org',
      accountKind: 'organisation',
    });

    expect(typeof org.cardNumber).toBe('number');
    expect(org.cardNumber).toBeGreaterThan(0);
  });
});
