import { expect, test } from '@playwright/test';

import { readFileSync } from 'node:fs';

import { API_BASE_URL } from '../fixtures/api-client';
import { FIXTURE_STATE_PATH, STORAGE_STATE_PATH } from '../global-setup';
import type { FixtureState } from '../global-setup';

test.use({ storageState: STORAGE_STATE_PATH });

/**
 * Flow 5/5 — send a message. **No teardown available**, checked, not
 * assumed: `messaging.controller.ts` exposes no `@Delete` route at all —
 * neither a message nor a conversation can be removed once created (the same
 * absence-of-DELETE class TASKS.md already records for events). Every run of
 * this spec leaves one conversation and one message in the dev DB between the
 * two fixed fixture accounts, permanently. Documented here rather than
 * silently accepted, same as the sign-up spec documents its own leak.
 */
test('a player can start a conversation and send a message', async ({ page }) => {
  const state = JSON.parse(readFileSync(FIXTURE_STATE_PATH, 'utf-8')) as FixtureState;
  const messageText = `E2E 10.4 — ${String(Date.now())}`;

  await page.goto('/messages/new');
  await page.getByLabel('Participant user id').fill(state.secondary.userId);
  await page.getByRole('button', { name: 'Add participant' }).click();

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/conversations') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create conversation' }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status(), 'POST /conversations should succeed').toBe(201);
  const conversation = (await createResponse.json()) as { data: { id: string } };

  await page.waitForURL(new RegExp(`/messages/${conversation.data.id}`), { timeout: 15_000 });

  const sendResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/conversations/${conversation.data.id}/messages`) &&
      response.request().method() === 'POST',
  );
  await page.getByLabel('Message body').fill(messageText);
  await page.getByRole('button', { name: 'Send message' }).click();
  const sendResponse = await sendResponsePromise;
  expect(sendResponse.status(), 'POST /conversations/:id/messages should succeed').toBe(201);

  await expect(page.getByText(messageText).first()).toBeVisible();

  // Confirm delivery from the recipient's own side, not only the sender's
  // optimistic UI — matches this backend's real read boundary.
  const deliveredResponse = await fetch(
    `${API_BASE_URL}/conversations/${conversation.data.id}/messages`,
    { headers: { authorization: `Bearer ${state.secondary.accessToken}` } },
  );
  expect(deliveredResponse.ok).toBe(true);
  // List responses unwrap to a bare array in `data`, not `{ items }`
  // (`buildPaginatedEnvelope`, apps/backend/src/infrastructure/http/envelope.ts).
  const delivered = (await deliveredResponse.json()) as { data: { body: string }[] };
  expect(delivered.data.some((item) => item.body === messageText)).toBe(true);
});
