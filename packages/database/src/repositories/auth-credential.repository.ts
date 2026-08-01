import type { AuthCredential, AuthCredentialType, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * AuthCredential persistence (S2 §10.1). Password/OAuth identity binding only —
 * hashing and session issuance live in the auth domain.
 */
export interface AuthCredentialRepository {
  findByTypeAndProviderRef(
    type: AuthCredentialType,
    providerRef: string,
  ): Promise<AuthCredential | null>;
  findPasswordByUserId(userId: string): Promise<AuthCredential | null>;
  create(data: Prisma.AuthCredentialCreateInput): Promise<AuthCredential>;
  updateSecretHash(id: string, secretHash: string): Promise<AuthCredential>;
}

export class PrismaAuthCredentialRepository implements AuthCredentialRepository {
  constructor(private readonly db: DatabaseClient) {}

  findByTypeAndProviderRef(
    type: AuthCredentialType,
    providerRef: string,
  ): Promise<AuthCredential | null> {
    return this.db.authCredential.findUnique({
      where: { type_providerRef: { type, providerRef } },
    });
  }

  findPasswordByUserId(userId: string): Promise<AuthCredential | null> {
    return this.db.authCredential.findFirst({
      where: { userId, type: 'password' },
    });
  }

  create(data: Prisma.AuthCredentialCreateInput): Promise<AuthCredential> {
    return this.db.authCredential.create({ data });
  }

  updateSecretHash(id: string, secretHash: string): Promise<AuthCredential> {
    return this.db.authCredential.update({
      where: { id },
      data: { secretHash },
    });
  }
}
