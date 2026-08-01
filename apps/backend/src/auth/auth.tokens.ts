/**
 * DI tokens binding the auth session flow to `@gmrlog/database` repository
 * implementations (F6.3 — services depend on repository contracts).
 */
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export const AUTH_CREDENTIAL_REPOSITORY = Symbol('AUTH_CREDENTIAL_REPOSITORY');
export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
export const AUTH_USER_SETTINGS_REPOSITORY = Symbol('AUTH_USER_SETTINGS_REPOSITORY');
