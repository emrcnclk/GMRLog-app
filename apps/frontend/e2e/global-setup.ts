import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { ensureFixtureAccount, getMe } from './fixtures/api-client';

/**
 * Two fixed, idempotent accounts, created once ever per environment and
 * reused on every run (`ensureFixtureAccount` logs in if they already exist).
 * The 10.4 brief is explicit that leaking a fresh account into the dev DB on
 * every run is worse than no suite — there is no `DELETE /users/:id` this
 * backend exposes (checked), so this is the only account-count-stable option
 * available. The sign-up spec is the one deliberate exception: it exercises
 * real account creation through the UI, so it leaks one account per run by
 * necessity — documented in its own file, not hidden here.
 */
const PRIMARY = {
  email: 'e2e-primary@e2e.gmrlog.local',
  password: 'E2ePrimaryPass12',
  displayName: 'E2E Primary',
  handle: 'e2e_primary',
};

const SECONDARY = {
  email: 'e2e-secondary@e2e.gmrlog.local',
  password: 'E2eSecondaryPass12',
  displayName: 'E2E Secondary',
  handle: 'e2e_secondary',
};

export interface FixtureState {
  primary: {
    email: string;
    password: string;
    accessToken: string;
    refreshToken: string;
    userId: string;
  };
  secondary: {
    email: string;
    password: string;
    accessToken: string;
    refreshToken: string;
    userId: string;
  };
}

export const FIXTURE_STATE_PATH = path.join(__dirname, '.fixture-state.json');
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth-state.json');

/**
 * Runs once before the whole suite (Playwright's `globalSetup`). Seeds both
 * fixture accounts over the API (no browser needed for this part) and writes
 * a Playwright `storageState` for the primary account so the log-game,
 * view-profile and send-message specs start already signed in — they are not
 * re-testing login, so re-driving the login form for each of them would only
 * add avoidable auth-endpoint traffic on a rate-limited route.
 */
export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8081';

  const primaryTokens = await ensureFixtureAccount(PRIMARY);
  const primaryMe = await getMe(primaryTokens.accessToken);

  const secondaryTokens = await ensureFixtureAccount(SECONDARY);
  const secondaryMe = await getMe(secondaryTokens.accessToken);

  const state: FixtureState = {
    primary: { ...PRIMARY, ...primaryTokens, userId: primaryMe.id },
    secondary: { ...SECONDARY, ...secondaryTokens, userId: secondaryMe.id },
  };
  writeFileSync(FIXTURE_STATE_PATH, JSON.stringify(state, null, 2));

  // Web build's SecureStorage adapter double-prefixes every key with
  // `gmrlog.secure.` on top of session-manager's own `gmrlog.session.*` names
  // (CLAUDE.md's own documented trap, re-confirmed by 9.6). Writing the wrong
  // key here would look exactly like an expired session in every dependent
  // spec — this storageState IS the check that the trap is still named right.
  writeFileSync(
    STORAGE_STATE_PATH,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            { name: 'gmrlog.secure.gmrlog.session.access', value: primaryTokens.accessToken },
            { name: 'gmrlog.secure.gmrlog.session.refresh', value: primaryTokens.refreshToken },
          ],
        },
      ],
    }),
  );
}
