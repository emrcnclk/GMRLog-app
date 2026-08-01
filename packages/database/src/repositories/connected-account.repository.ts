import type { ConnectedAccount, ConnectedProvider, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** ConnectedAccount persistence (S2 §10.1). Guest link state — never identity authority. */
export interface ConnectedAccountRepository {
  create(data: Prisma.ConnectedAccountCreateInput): Promise<ConnectedAccount>;
  findById(id: string): Promise<ConnectedAccount | null>;
  findByUserAndProvider(
    userId: string,
    provider: ConnectedProvider,
  ): Promise<ConnectedAccount | null>;
  listByUser(userId: string): Promise<ConnectedAccount[]>;
  update(id: string, data: Prisma.ConnectedAccountUpdateInput): Promise<ConnectedAccount>;
  delete(id: string): Promise<ConnectedAccount>;
}

export class PrismaConnectedAccountRepository implements ConnectedAccountRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ConnectedAccountCreateInput): Promise<ConnectedAccount> {
    return this.db.connectedAccount.create({ data });
  }

  findById(id: string): Promise<ConnectedAccount | null> {
    return this.db.connectedAccount.findUnique({ where: { id } });
  }

  findByUserAndProvider(
    userId: string,
    provider: ConnectedProvider,
  ): Promise<ConnectedAccount | null> {
    return this.db.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  }

  listByUser(userId: string): Promise<ConnectedAccount[]> {
    return this.db.connectedAccount.findMany({ where: { userId } });
  }

  update(id: string, data: Prisma.ConnectedAccountUpdateInput): Promise<ConnectedAccount> {
    return this.db.connectedAccount.update({ where: { id }, data });
  }

  delete(id: string): Promise<ConnectedAccount> {
    return this.db.connectedAccount.delete({ where: { id } });
  }
}
