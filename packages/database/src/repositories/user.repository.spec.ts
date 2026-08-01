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
});
