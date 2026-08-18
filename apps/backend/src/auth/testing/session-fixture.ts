import type { Session, SessionRepository } from '@gmrlog/database';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { SESSION_REPOSITORY } from '../auth.tokens';
import { TokenService } from '../jwt/token.service';

/**
 * In-memory `SessionRepository` for controller specs.
 *
 * Bug 5 made every authenticated request read the session row behind the token,
 * so a spec that mints a token now has to have a session to mint it against.
 * Controller specs override `PrismaService` with `{}`, which would make the real
 * `PrismaSessionRepository` throw on the first lookup; this stands in for it.
 */
export class MemorySessionRepository implements SessionRepository {
  readonly rows = new Map<string, Session>();
  private seq = 0;

  create(data: { user: { connect: { id: string } }; expiresAt: Date }): Promise<Session> {
    this.seq += 1;
    const row = {
      id: `session-${String(this.seq)}`,
      userId: data.user.connect.id,
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    } as unknown as Session;
    this.rows.set(row.id, row);
    return Promise.resolve(row);
  }

  findById(id: string): Promise<Session | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  listByUser(userId: string): Promise<Session[]> {
    return Promise.resolve([...this.rows.values()].filter((row) => row.userId === userId));
  }

  revoke(id: string): Promise<Session> {
    const row = this.rows.get(id);
    if (row === undefined) throw new Error(`no session ${id}`);
    const next = { ...row, revokedAt: new Date() };
    this.rows.set(id, next);
    return Promise.resolve(next);
  }

  revokeIfActive(id: string): Promise<boolean> {
    // Body runs synchronously between awaits, which models the row lock the
    // real UPDATE takes: two concurrent callers cannot both see it active.
    const row = this.rows.get(id);
    if (row === undefined) {
      return Promise.resolve(false);
    }
    if (row.revokedAt !== null) {
      return Promise.resolve(false);
    }
    this.rows.set(id, { ...row, revokedAt: new Date() });
    return Promise.resolve(true);
  }

  delete(id: string): Promise<Session> {
    const row = this.rows.get(id);
    if (row === undefined) throw new Error(`no session ${id}`);
    this.rows.delete(id);
    return Promise.resolve(row);
  }

  revokeExpiredBefore(now: Date): Promise<number> {
    let count = 0;
    for (const [id, row] of this.rows) {
      if (row.revokedAt === null && row.expiresAt < now) {
        this.rows.set(id, { ...row, revokedAt: now });
        count += 1;
      }
    }
    return Promise.resolve(count);
  }

  deleteRevokedOrExpiredBefore(now: Date): Promise<number> {
    let count = 0;
    for (const [id, row] of this.rows) {
      if ((row.revokedAt !== null && row.revokedAt < now) || row.expiresAt < now) {
        this.rows.delete(id);
        count += 1;
      }
    }
    return Promise.resolve(count);
  }

  /** Seeds a live session directly, for specs that need a known id. */
  seed(userId: string, id = `session-${userId}`): Session {
    const row = {
      id,
      userId,
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null,
      createdAt: new Date(),
    } as unknown as Session;
    this.rows.set(id, row);
    return row;
  }
}

/**
 * Mints an access token backed by a live session, the way `SessionsService`
 * does in production. Use in place of a bare `signAccessToken(userId)` — a
 * token with no session claim is now rejected as unauthenticated.
 */
export async function issueTestAccessToken(
  // Accepts a `TestingModule` or an initialised Nest application — specs mint
  // tokens from whichever one is in scope.
  container: TestingModule | INestApplication,
  userId: string,
): Promise<string> {
  const sessions = container.get<MemorySessionRepository>(SESSION_REPOSITORY);
  const session = sessions.seed(userId);
  const tokens = container.get<TokenService>(TokenService);
  return tokens.signAccessToken(userId, session.id);
}
