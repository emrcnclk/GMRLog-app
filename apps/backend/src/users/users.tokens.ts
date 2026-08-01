/**
 * DI tokens binding the user domain to `@gmrlog/database` repository
 * implementations (F6.3 — services depend on repository contracts, never on
 * Prisma directly).
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const USER_SETTINGS_REPOSITORY = Symbol('USER_SETTINGS_REPOSITORY');
export const CONNECTED_ACCOUNT_REPOSITORY = Symbol('CONNECTED_ACCOUNT_REPOSITORY');
export const UPLOAD_REPOSITORY = Symbol('USER_UPLOAD_REPOSITORY');
