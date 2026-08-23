import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Persistence handle accepted by every repository. A live `PrismaClient` or a
 * transaction-scoped client both satisfy this — repositories never own the
 * connection lifecycle, they only speak persistence (S2 repository law).
 *
 * The union is what makes the second half of that sentence true. It used to
 * read `PrismaClient` alone, which meant the doc described an intent the type
 * refused: a caller that wanted two repositories to write inside one
 * transaction had no way to hand them the transaction. `SessionsService.register`
 * is the case that surfaced it — four writes across three repositories, with a
 * comment claiming a failure "fails loudly rather than leaving an account with
 * no evidence of consent behind it," and nothing making that so.
 */
export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

/**
 * Runs `fn` inside a transaction, or inline when `db` is *already*
 * transaction-scoped.
 *
 * Prisma's transaction client deliberately has no `$transaction` of its own —
 * there are no nested transactions — so a repository that wants to group its
 * own writes cannot simply call `this.db.$transaction`. Calling it inline in
 * that case is correct rather than a compromise: the caller's transaction is
 * already the atomic boundary those writes needed.
 */
export function withTransaction<T>(
  db: DatabaseClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return '$transaction' in db ? db.$transaction(fn) : fn(db);
}
