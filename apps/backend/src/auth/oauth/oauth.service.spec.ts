import { beforeEach, describe, expect, it } from 'vitest';

import { OAuthService } from './oauth.service';
import type { OAuthIdentity } from './oauth.types';

interface FakeUser {
  id: string;
  handle: string;
  displayName: string;
  deletedAt: Date | null;
}

interface FakeCredential {
  id: string;
  userId: string;
  type: 'password' | 'oauth';
  provider: string | null;
  providerRef: string | null;
  secretHash: string | null;
}

interface FakeAccountLink {
  id: string;
  userId: string;
  provider: string;
  purpose: string;
  status: string;
}

function uniqueViolation(): Error & { code: string } {
  const error = new Error('Unique constraint failed') as Error & { code: string };
  error.code = 'P2002';
  return error;
}

interface FakeDb {
  user: {
    findUnique(args: { where: { id?: string; handle?: string } }): Promise<FakeUser | null>;
    create(args: { data: { handle: string; displayName: string } }): Promise<FakeUser>;
  };
  authCredential: {
    findUnique(args: {
      where: { type_providerRef: { type: string; providerRef: string } };
    }): Promise<FakeCredential | null>;
    findFirst(args: {
      where: { userId: string; type: string; provider?: string };
    }): Promise<FakeCredential | null>;
    findMany(args: { where: { userId: string } }): Promise<FakeCredential[]>;
    delete(args: { where: { id: string } }): Promise<FakeCredential>;
    create(args: {
      data: {
        user: { connect: { id: string } };
        type: 'password' | 'oauth';
        provider?: string;
        providerRef: string | null;
        secretHash?: string | null;
      };
    }): Promise<FakeCredential>;
  };
  accountLink: {
    create(args: {
      data: {
        user: { connect: { id: string } };
        provider: string;
        purpose: string;
        status: string;
      };
    }): Promise<FakeAccountLink>;
  };
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  $transaction<T>(fn: (tx: FakeDb) => Promise<T>): Promise<T>;
}

/**
 * Minimal in-memory stand-in for the slice of `Prisma.TransactionClient`
 * `OAuthService` touches — `user`, `authCredential`, `accountLink`, and a
 * `$transaction` that just runs the callback against itself (no real
 * isolation; concurrency is exercised explicitly in the race test below by
 * overriding a single method for one call).
 */
function createFakeDb() {
  const users = new Map<string, FakeUser>();
  const credentials: FakeCredential[] = [];
  const accountLinks: FakeAccountLink[] = [];
  let userSeq = 0;
  let credSeq = 0;
  let linkSeq = 0;

  const db: FakeDb = {
    user: {
      async findUnique({ where }) {
        if (where.id !== undefined) return users.get(where.id) ?? null;
        if (where.handle !== undefined) {
          return [...users.values()].find((u) => u.handle === where.handle) ?? null;
        }
        return null;
      },
      async create({ data }) {
        if ([...users.values()].some((u) => u.handle === data.handle)) {
          throw uniqueViolation();
        }
        userSeq += 1;
        const row: FakeUser = {
          id: `user-${userSeq}`,
          handle: data.handle,
          displayName: data.displayName,
          deletedAt: null,
        };
        users.set(row.id, row);
        return row;
      },
    },
    authCredential: {
      async findUnique({ where }) {
        const { type, providerRef } = where.type_providerRef;
        return credentials.find((c) => c.type === type && c.providerRef === providerRef) ?? null;
      },
      async findFirst({ where }) {
        return (
          credentials.find(
            (c) =>
              c.userId === where.userId &&
              c.type === where.type &&
              (where.provider === undefined || c.provider === where.provider),
          ) ?? null
        );
      },
      async findMany({ where }) {
        return credentials.filter((c) => c.userId === where.userId);
      },
      async delete({ where }) {
        const index = credentials.findIndex((c) => c.id === where.id);
        if (index < 0) throw new Error(`credential ${where.id} not found`);
        const [row] = credentials.splice(index, 1);
        return row!;
      },
      async create({ data }) {
        if (
          data.providerRef !== null &&
          credentials.some((c) => c.type === data.type && c.providerRef === data.providerRef)
        ) {
          throw uniqueViolation();
        }
        credSeq += 1;
        const row: FakeCredential = {
          id: `cred-${credSeq}`,
          userId: data.user.connect.id,
          type: data.type,
          provider: data.provider ?? null,
          providerRef: data.providerRef,
          secretHash: data.secretHash ?? null,
        };
        credentials.push(row);
        return row;
      },
    },
    accountLink: {
      async create({ data }) {
        linkSeq += 1;
        const row: FakeAccountLink = {
          id: `link-${linkSeq}`,
          userId: data.user.connect.id,
          provider: data.provider,
          purpose: data.purpose,
          status: data.status,
        };
        accountLinks.push(row);
        return row;
      },
    },
    async $queryRaw() {
      // `disconnectLogin`'s row lock — no real concurrency to serialize
      // against in-memory, so this is a no-op the tests don't depend on.
      return [];
    },
    async $transaction<T>(fn: (tx: FakeDb) => Promise<T>): Promise<T> {
      // A thrown error must undo only *this attempt's own* writes — real
      // Postgres rolls back the transaction, and OAuthService's race-retry
      // depends on that. Tracked by id rather than a whole-store snapshot so
      // a write made by a *different*, already-committed transaction while
      // this one was in flight (the race test below) survives the rollback,
      // same as it would against a real database.
      const createdUserIds: string[] = [];
      const createdCredentialIds: string[] = [];
      const createdAccountLinkIds: string[] = [];
      const tx: FakeDb = {
        user: {
          findUnique: db.user.findUnique,
          create: async (args) => {
            const row = await db.user.create(args);
            createdUserIds.push(row.id);
            return row;
          },
        },
        authCredential: {
          findUnique: db.authCredential.findUnique,
          findFirst: db.authCredential.findFirst,
          findMany: db.authCredential.findMany,
          delete: db.authCredential.delete,
          create: async (args) => {
            const row = await db.authCredential.create(args);
            createdCredentialIds.push(row.id);
            return row;
          },
        },
        accountLink: {
          create: async (args) => {
            const row = await db.accountLink.create(args);
            createdAccountLinkIds.push(row.id);
            return row;
          },
        },
        $queryRaw: db.$queryRaw,
        $transaction: db.$transaction,
      };

      try {
        return await fn(tx);
      } catch (error) {
        for (const id of createdUserIds) users.delete(id);
        for (const id of createdCredentialIds) {
          const index = credentials.findIndex((c) => c.id === id);
          if (index >= 0) credentials.splice(index, 1);
        }
        for (const id of createdAccountLinkIds) {
          const index = accountLinks.findIndex((l) => l.id === id);
          if (index >= 0) accountLinks.splice(index, 1);
        }
        throw error;
      }
    },
  };

  return { db, users, credentials, accountLinks };
}

function makeIdentity(overrides: Partial<OAuthIdentity> = {}): OAuthIdentity {
  return {
    provider: 'google',
    subject: 'sub-1',
    email: 'player@example.com',
    emailVerified: true,
    displayName: 'Kaan',
    ...overrides,
  };
}

describe('OAuthService', () => {
  let fake: ReturnType<typeof createFakeDb>;
  let service: OAuthService;

  beforeEach(() => {
    fake = createFakeDb();
    service = new OAuthService(fake.db as never);
  });

  it('rule 1 — signs in an existing oauth credential without touching email or creating rows', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    fake.credentials.push({
      id: 'cred-existing',
      userId: user.id,
      type: 'oauth',
      provider: 'google',
      providerRef: 'google:sub-1',
      secretHash: null,
    });

    // Provider now reports a *different* email than anything on file — rule 1
    // must not care, and must not create a placeholder for it.
    const result = await service.resolveLogin(
      makeIdentity({ email: 'changed@example.com', emailVerified: true }),
    );

    expect(result).toEqual({ outcome: 'signed_in', user });
    expect(fake.credentials).toHaveLength(1);
    expect(fake.accountLinks).toHaveLength(0);
  });

  it('rule 1 — rejects when the linked user was soft-deleted', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    user.deletedAt = new Date();
    fake.credentials.push({
      id: 'cred-existing',
      userId: user.id,
      type: 'oauth',
      provider: 'google',
      providerRef: 'google:sub-1',
      secretHash: null,
    });

    const result = await service.resolveLogin(makeIdentity());
    expect(result).toEqual({ outcome: 'rejected', reason: 'account_deleted' });
  });

  it('rule 2 — links a verified email to an existing password account', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    fake.credentials.push({
      id: 'cred-password',
      userId: user.id,
      type: 'password',
      provider: null,
      providerRef: 'player@example.com',
      secretHash: 'hashed',
    });

    const result = await service.resolveLogin(makeIdentity());

    expect(result).toEqual({ outcome: 'linked', user });
    const oauthCred = fake.credentials.find((c) => c.type === 'oauth');
    expect(oauthCred).toMatchObject({ userId: user.id, providerRef: 'google:sub-1' });
    expect(fake.accountLinks).toEqual([
      expect.objectContaining({ userId: user.id, purpose: 'login', status: 'completed' }),
    ]);
  });

  it('rule 2 — rejects when the matched password account was soft-deleted', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    user.deletedAt = new Date();
    fake.credentials.push({
      id: 'cred-password',
      userId: user.id,
      type: 'password',
      provider: null,
      providerRef: 'player@example.com',
      secretHash: 'hashed',
    });

    const result = await service.resolveLogin(makeIdentity());
    expect(result).toEqual({ outcome: 'rejected', reason: 'account_deleted' });
  });

  it('rule 3 — refuses to link an unverified email onto a real password account (takeover path)', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    fake.credentials.push({
      id: 'cred-password',
      userId: user.id,
      type: 'password',
      provider: null,
      providerRef: 'player@example.com',
      secretHash: 'hashed',
    });

    const result = await service.resolveLogin(makeIdentity({ emailVerified: false }));

    expect(result).toEqual({
      outcome: 'rejected',
      reason: 'unverified_email_conflict',
      hasPassword: true,
    });
    expect(fake.credentials).toHaveLength(1);
  });

  it('rule 3 — refuses to link an unverified email onto an oauth-only claim placeholder', async () => {
    const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
    fake.credentials.push({
      id: 'cred-placeholder',
      userId: user.id,
      type: 'password',
      provider: null,
      providerRef: 'player@example.com',
      secretHash: null,
    });

    const result = await service.resolveLogin(makeIdentity({ emailVerified: false }));

    expect(result).toEqual({
      outcome: 'rejected',
      reason: 'unverified_email_conflict',
      hasPassword: false,
    });
  });

  it('rule 4 — provisions a new user, an oauth credential, and a verified-email claim placeholder', async () => {
    const result = await service.resolveLogin(makeIdentity());

    expect(result.outcome).toBe('created');
    const created = result.outcome === 'created' ? result.user : never();
    expect(created.handle).toBe('kaan');

    expect(fake.credentials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: created.id,
          type: 'oauth',
          providerRef: 'google:sub-1',
        }),
        expect.objectContaining({
          userId: created.id,
          type: 'password',
          providerRef: 'player@example.com',
          secretHash: null,
        }),
      ]),
    );
    expect(fake.accountLinks).toEqual([
      expect.objectContaining({ userId: created.id, purpose: 'login', status: 'completed' }),
    ]);
  });

  it('rule 4 — does not plant a claim placeholder for an unverified email (would let an attacker squat it)', async () => {
    const result = await service.resolveLogin(makeIdentity({ emailVerified: false }));

    expect(result.outcome).toBe('created');
    expect(fake.credentials).toHaveLength(1);
    expect(fake.credentials[0]?.type).toBe('oauth');
  });

  it('rule 4 — handles a provider that returns no email at all (Discord edge case)', async () => {
    const result = await service.resolveLogin(makeIdentity({ email: null, emailVerified: false }));

    expect(result.outcome).toBe('created');
    expect(fake.credentials).toHaveLength(1);
    expect(fake.credentials[0]?.type).toBe('oauth');
  });

  it('same email arriving from a second verified provider links to the same user', async () => {
    const first = await service.resolveLogin(
      makeIdentity({ provider: 'google', subject: 'sub-google' }),
    );
    expect(first.outcome).toBe('created');
    const firstUser = first.outcome === 'created' ? first.user : never();

    const second = await service.resolveLogin(
      makeIdentity({ provider: 'discord', subject: 'sub-discord' }),
    );

    expect(second).toEqual({ outcome: 'linked', user: firstUser });
    expect(fake.credentials.filter((c) => c.type === 'oauth')).toHaveLength(2);
  });

  it('deduplicates the generated handle across repeat display names', async () => {
    const a = await service.resolveLogin(
      makeIdentity({ provider: 'google', subject: 'sub-a', displayName: 'Kaan' }),
    );
    const b = await service.resolveLogin(
      makeIdentity({
        provider: 'discord',
        subject: 'sub-b',
        email: 'other@example.com',
        displayName: 'Kaan',
      }),
    );

    const handleA = a.outcome === 'created' ? a.user.handle : never();
    const handleB = b.outcome === 'created' ? b.user.handle : never();
    expect(handleA).toBe('kaan');
    expect(handleB).toBe('kaan2');
  });

  it('retries and joins as signed_in when two devices race to create the same oauth credential', async () => {
    let raced = false;
    const originalCreate = fake.db.authCredential.create.bind(fake.db.authCredential);
    fake.db.authCredential.create = async (args) => {
      if (!raced && args.data.type === 'oauth') {
        raced = true;
        // Simulate the other device's transaction committing first, between
        // this transaction's rule-1 lookup (which found nothing) and its
        // attempt to insert.
        const winner = await fake.db.user.create({
          data: { handle: 'racer', displayName: 'Racer' },
        });
        fake.credentials.push({
          id: 'cred-winner',
          userId: winner.id,
          type: 'oauth',
          provider: 'google',
          providerRef: 'google:sub-race',
          secretHash: null,
        });
        throw uniqueViolation();
      }
      return originalCreate(args);
    };

    const result = await service.resolveLogin(
      makeIdentity({ subject: 'sub-race', email: null, emailVerified: false }),
    );

    expect(result.outcome).toBe('signed_in');
    expect(fake.users.size).toBe(1);
  });

  describe('connectLogin', () => {
    it('attaches a verified identity to the caller, not to whoever the email would have matched', async () => {
      const caller = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      const other = await fake.db.user.create({
        data: { handle: 'zeynep', displayName: 'Zeynep' },
      });
      // A different user already claimed this email via password signup —
      // resolveLogin's rule 2 would link there; connectLogin must not.
      fake.credentials.push({
        id: 'cred-other-password',
        userId: other.id,
        type: 'password',
        provider: null,
        providerRef: 'player@example.com',
        secretHash: 'hashed',
      });

      const result = await service.connectLogin(caller.id, makeIdentity());

      expect(result).toEqual({ outcome: 'connected' });
      const oauthCred = fake.credentials.find((c) => c.type === 'oauth');
      expect(oauthCred).toMatchObject({ userId: caller.id, providerRef: 'google:sub-1' });
      expect(fake.accountLinks).toEqual([
        expect.objectContaining({ userId: caller.id, purpose: 'connect', status: 'completed' }),
      ]);
    });

    it('is idempotent when the caller connects the same identity twice', async () => {
      const caller = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      await service.connectLogin(caller.id, makeIdentity());

      const result = await service.connectLogin(caller.id, makeIdentity());

      expect(result).toEqual({ outcome: 'already_connected' });
      expect(fake.credentials.filter((c) => c.type === 'oauth')).toHaveLength(1);
    });

    it('refuses to steal an identity already connected to a different account', async () => {
      const owner = await fake.db.user.create({
        data: { handle: 'zeynep', displayName: 'Zeynep' },
      });
      const caller = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      fake.credentials.push({
        id: 'cred-owner',
        userId: owner.id,
        type: 'oauth',
        provider: 'google',
        providerRef: 'google:sub-1',
        secretHash: null,
      });

      const result = await service.connectLogin(caller.id, makeIdentity());

      expect(result).toEqual({ outcome: 'rejected', reason: 'identity_in_use' });
      expect(fake.credentials).toHaveLength(1);
    });
  });

  describe('disconnectLogin', () => {
    it('refuses to disconnect the caller’s only usable sign-in method', async () => {
      const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      fake.credentials.push({
        id: 'cred-google',
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerRef: 'google:sub-1',
        secretHash: null,
      });

      const result = await service.disconnectLogin(user.id, 'google');

      expect(result).toEqual({ outcome: 'rejected', reason: 'last_method' });
      expect(fake.credentials).toHaveLength(1);
    });

    it('refuses when the only other credential is an oauth-signup placeholder (secretHash: null)', async () => {
      const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      fake.credentials.push(
        {
          id: 'cred-google',
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerRef: 'google:sub-1',
          secretHash: null,
        },
        {
          id: 'cred-placeholder',
          userId: user.id,
          type: 'password',
          provider: null,
          providerRef: 'player@example.com',
          secretHash: null,
        },
      );

      const result = await service.disconnectLogin(user.id, 'google');

      expect(result).toEqual({ outcome: 'rejected', reason: 'last_method' });
      expect(fake.credentials).toHaveLength(2);
    });

    it('allows disconnecting when a real password remains', async () => {
      const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      fake.credentials.push(
        {
          id: 'cred-google',
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerRef: 'google:sub-1',
          secretHash: null,
        },
        {
          id: 'cred-password',
          userId: user.id,
          type: 'password',
          provider: null,
          providerRef: 'player@example.com',
          secretHash: 'hashed',
        },
      );

      const result = await service.disconnectLogin(user.id, 'google');

      expect(result).toEqual({ outcome: 'disconnected' });
      expect(fake.credentials).toHaveLength(1);
      expect(fake.credentials[0]?.type).toBe('password');
    });

    it('allows disconnecting when another oauth provider remains', async () => {
      const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });
      fake.credentials.push(
        {
          id: 'cred-google',
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerRef: 'google:sub-1',
          secretHash: null,
        },
        {
          id: 'cred-discord',
          userId: user.id,
          type: 'oauth',
          provider: 'discord',
          providerRef: 'discord:sub-2',
          secretHash: null,
        },
      );

      const result = await service.disconnectLogin(user.id, 'google');

      expect(result).toEqual({ outcome: 'disconnected' });
      expect(fake.credentials).toHaveLength(1);
      expect(fake.credentials[0]?.provider).toBe('discord');
    });

    it('reports not_connected when the provider was never linked', async () => {
      const user = await fake.db.user.create({ data: { handle: 'kaan', displayName: 'Kaan' } });

      const result = await service.disconnectLogin(user.id, 'google');

      expect(result).toEqual({ outcome: 'rejected', reason: 'not_connected' });
    });
  });
});

function never(): never {
  throw new Error('assertion setup failed — outcome was not as expected');
}
