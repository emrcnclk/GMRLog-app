import { expect, test } from '../fixtures/base';

import { readFileSync } from 'node:fs';

import { deleteReview, firstDiscoverableGame } from '../fixtures/api-client';
import { FIXTURE_STATE_PATH, STORAGE_STATE_PATH } from '../global-setup';
import type { FixtureState } from '../global-setup';

test.use({ storageState: STORAGE_STATE_PATH });

let createdReviewId: string | null = null;

test.afterEach(async () => {
  // Teardown is part of the task, not an afterthought (10.4's own brief).
  // `DELETE /reviews/:id` exists (checked against reviews.controller.ts) —
  // unlike accounts and messages, this flow's data can be fully removed.
  if (createdReviewId === null) return;
  const state = JSON.parse(readFileSync(FIXTURE_STATE_PATH, 'utf-8')) as FixtureState;
  await deleteReview(createdReviewId, state.primary.accessToken);
  createdReviewId = null;
});

test('a player can log and review a game from its hub page', async ({ page }) => {
  const state = JSON.parse(readFileSync(FIXTURE_STATE_PATH, 'utf-8')) as FixtureState;
  const game = await firstDiscoverableGame(state.primary.accessToken);

  await page.goto(`/game/${game.id}`);
  await expect(page.getByText(game.title).first()).toBeVisible();

  await page.getByRole('button', { name: 'Log & review' }).click();
  await page.waitForURL(/\/review\/create/, { timeout: 15_000 });

  // §16's five-star control over the 1–10 scale (star-rating.tsx) — the
  // fifth star is worth the max, 10.
  await page.getByRole('button', { name: 'Rate 10 of 10' }).click();
  await page.getByLabel('Review text').fill('E2E 10.4 — automated log & review flow.');

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/reviews') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Publish' }).click();

  const response = await responsePromise;
  expect(response.status(), 'POST /reviews should succeed').toBe(201);
  const body = (await response.json()) as { data: { id: string; gameId: string; rating: number } };
  createdReviewId = body.data.id;

  expect(body.data.gameId).toBe(game.id);
  expect(body.data.rating).toBe(10);

  // ReviewComposer's onClose (mode: 'create') calls router.back() on success.
  await page.waitForURL(new RegExp(`/game/${game.id}`), { timeout: 15_000 });
});
