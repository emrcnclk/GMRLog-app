import type { Prisma, User } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * User persistence (S2 §10.1). Persistence only — no validation, no Trust
 * decisions, no domain logic. Account-removal policy lives in the owning domain.
 */
export interface UserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findManyByIds(ids: readonly string[]): Promise<User[]>;
  findByHandle(handle: string): Promise<User | null>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  softDelete(id: string): Promise<User>;
  delete(id: string): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findManyByIds(ids: readonly string[]): Promise<User[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.user.findMany({ where: { id: { in: [...ids] } } });
  }

  findByHandle(handle: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { handle } });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<User> {
    return this.db.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<User> {
    return this.db.user.delete({ where: { id } });
  }
}
