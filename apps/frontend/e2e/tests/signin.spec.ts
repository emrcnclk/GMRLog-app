import { expect, test } from '@playwright/test';

import { readFileSync } from 'node:fs';

import { FIXTURE_STATE_PATH } from '../global-setup';
import type { FixtureState } from '../global-setup';

// No `storageState` here on purpose — this spec IS the login test, so it
// starts logged out and drives the real form. One login call, well inside
// the auth rate limiter (CLAUDE.md's own note on repeated-failed-login 429s
// is about brute-forcing; a single correct-credentials attempt is not that).
test.use({ storageState: { cookies: [], origins: [] } });

test('an existing player can sign in with email and password', async ({ page }) => {
  const state = JSON.parse(readFileSync(FIXTURE_STATE_PATH, 'utf-8')) as FixtureState;

  await page.goto('/');
  // A first-time (no storageState) browser context hits `OnboardingGate`
  // before the login form — real first-run behavior, not test scaffolding.
  await page.getByRole('button', { name: 'Skip onboarding' }).click();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/sessions') &&
      !response.url().includes('/sessions/register') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await page.getByLabel('Email').fill(state.primary.email);
  await page.getByLabel('Password').fill(state.primary.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  const response = await responsePromise;
  expect(response.status(), 'POST /sessions should succeed').toBe(201);

  await page.waitForURL(/\/home/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Continue with email' })).toHaveCount(0);
});
