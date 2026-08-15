import { expect, test } from '@playwright/test';

import { getMe } from '../fixtures/api-client';

/**
 * Flow 1/5 — sign up.
 *
 * The one spec in this suite that deliberately creates a brand-new account
 * through the real UI on every run, because that IS what sign-up means to
 * test. Known, accepted cost: there is no `DELETE /users/:id` anywhere in
 * `apps/backend` (checked directly against the controllers), so this account
 * is never removed — it joins the dev DB permanently, one row per CI run.
 * Every other spec in this suite reuses two fixed, idempotent accounts for
 * exactly this reason; this is the one flow that cannot.
 */
test('a new player can create an account and reach the app', async ({ page }) => {
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const handle = `e2esu_${unique}`.slice(0, 24);
  const email = `${handle}@e2e.gmrlog.local`;

  // Unlike `/` (auth-gate.spec.ts), `/register`'s own route file
  // (`app/(auth)/register.tsx`) does not wrap `RegisterScreen` in
  // `OnboardingGate` — navigating straight here never shows the onboarding
  // carousel, confirmed by reading the route file after signin.spec.ts's
  // identical wait timed out here on the first draft of this spec.
  await page.goto('/register');

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/sessions/register') && response.request().method() === 'POST',
  );

  await page.getByLabel('Display name').fill('E2E Signup');
  await page.getByLabel('Handle').fill(handle);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Password').fill('E2eSignupPass12');
  await page.getByRole('button', { name: 'Create account' }).click();

  const response = await responsePromise;
  expect(response.status(), 'POST /sessions/register should succeed').toBe(201);

  // resolveAuthGate (src/navigation/auth-gate-decision.ts) redirects an
  // authenticated player out of the (auth) group to /(app)/(tabs)/home.
  await page.waitForURL(/\/home/, { timeout: 15_000 });

  const body = (await response.json()) as { data: { accessToken: string } };
  const me = await getMe(body.data.accessToken);
  expect(me.handle).toBe(handle);
});
