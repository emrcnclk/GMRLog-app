/**
 * DI tokens binding the library domain to `@gmrlog/database` repository
 * implementations (F6.3 — services depend on repository contracts, never on
 * Prisma directly).
 */
export const LIBRARY_ENTRY_REPOSITORY = Symbol('LIBRARY_ENTRY_REPOSITORY');
export const GAME_LOG_REPOSITORY = Symbol('GAME_LOG_REPOSITORY');
export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');
/** D3.24 `friend_wishlist_play` (NOTIFICATION_MATRIX.md). */
export const LIBRARY_FRIENDSHIP_REPOSITORY = Symbol('LIBRARY_FRIENDSHIP_REPOSITORY');
export const LIBRARY_NOTIFICATION_REPOSITORY = Symbol('LIBRARY_NOTIFICATION_REPOSITORY');
