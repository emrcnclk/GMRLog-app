/**
 * DI tokens binding the review domain to `@gmrlog/database` repository
 * implementations (F6.3 — services depend on repository contracts, never on
 * Prisma directly).
 */
export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');
export const REVIEW_GAME_REPOSITORY = Symbol('REVIEW_GAME_REPOSITORY');
export const REVIEW_USER_REPOSITORY = Symbol('REVIEW_USER_REPOSITORY');
export const REVIEW_ACTIVITY_REPOSITORY = Symbol('REVIEW_ACTIVITY_REPOSITORY');
