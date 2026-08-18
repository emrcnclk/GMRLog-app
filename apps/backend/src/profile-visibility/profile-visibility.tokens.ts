/**
 * DI tokens for the profile-visibility rule. Deliberately its own pair rather
 * than reusing `users.tokens` / `follows.tokens`: the guard is imported by four
 * unrelated domains (statistics, hero, achievements, archetypes), and none of
 * them should have to pull in `UsersModule` to answer "may this viewer look?".
 */
export const PROFILE_VISIBILITY_SETTINGS_REPOSITORY = Symbol(
  'PROFILE_VISIBILITY_SETTINGS_REPOSITORY',
);
export const PROFILE_VISIBILITY_FOLLOW_REPOSITORY = Symbol('PROFILE_VISIBILITY_FOLLOW_REPOSITORY');
