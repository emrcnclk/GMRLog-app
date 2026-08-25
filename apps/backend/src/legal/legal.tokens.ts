/**
 * 12.4 — DI token binding the consent surface to `@gmrlog/database`'s
 * repository contract (F6.3 — services depend on contracts, not Prisma).
 */
export const LEGAL_CONSENT_REPOSITORY = Symbol('LEGAL_CONSENT_REPOSITORY');
