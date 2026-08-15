import { expect, test } from '@playwright/test';

import { readFileSync } from 'node:fs';

import { FIXTURE_STATE_PATH, STORAGE_STATE_PATH } from '../global-setup';
import type { FixtureState } from '../global-setup';

test.use({ storageState: STORAGE_STATE_PATH });

test("a player can open another player's public profile", async ({ page }) => {
  const state = JSON.parse(readFileSync(FIXTURE_STATE_PATH, 'utf-8')) as FixtureState;

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes(`/users/${state.secondary.userId}`) && response.ok(),
  );

  await page.goto(`/user/${state.secondary.userId}`);
  await responsePromise;

  // Server-computed identity, not the client (CLAUDE.md's "scores are
  // server-side" law) — the assertion is that the real display name for the
  // real user id rendered, not a placeholder or an error state.
  await expect(page.getByText(state.secondary.displayName).first()).toBeVisible();
  await expect(page.getByText(`@${state.secondary.handle}`).first()).toBeVisible();
});
