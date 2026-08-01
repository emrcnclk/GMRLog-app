#!/usr/bin/env node
/**
 * Search smoke — create public post → BullMQ index → Meili hit.
 */

import { DEFAULTS, fail, httpJson, log, pass, registerUser, waitFor } from './lib/common.mjs';

async function main() {
  const api = DEFAULTS.apiBase;
  const { setTimeout: delay } = await import('node:timers/promises');
  await delay(Number(process.env.SMOKE_AUTH_COOLDOWN_MS ?? 5_000));

  const marker = `smokeseek_${Date.now().toString(36)}`;
  let user;
  for (let i = 0; i < 6; i += 1) {
    try {
      user = await registerUser(api);
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('429') && !message.includes('RATE_LIMITED')) {
        throw error;
      }
      log('search', `register rate-limited — waiting (${i + 1}/6)`);
      await delay(15_000);
    }
  }
  if (!user) {
    fail('post-create', 'could not register under rate limit');
  }
  log('search', `marker=${marker}`);

  const create = await httpJson(`${api}/posts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${user.accessToken}`,
      'idempotency-key': `post-${marker}`,
    },
    body: JSON.stringify({
      body: `Release smoke post about ${marker} gaming culture`,
      visibility: 'public',
    }),
  });
  if (!create.response.ok) {
    fail('post-create', JSON.stringify(create.body));
  }
  const postId = create.data?.id;
  if (!postId) {
    fail('post-create', 'missing id');
  }
  pass('post-create');

  await waitFor(
    'search-hit',
    async () => {
      const { response, data, body } = await httpJson(
        `${api}/search?q=${encodeURIComponent(marker)}`,
        { headers: { authorization: `Bearer ${user.accessToken}` } },
      );
      if (!response.ok) {
        throw new Error(`search ${response.status}`);
      }
      const items = Array.isArray(data) ? data : (data?.items ?? body?.data ?? []);
      const hit = items.some(
        (item) =>
          item.id === postId ||
          String(item.summary?.excerpt ?? item.summary?.body ?? '').includes(marker),
      );
      return hit ? body : null;
    },
    { timeoutMs: 60_000, intervalMs: 1_500 },
  );
  pass('search-hit');
  console.log('SMOKE_SEARCH PASS');
}

main().catch((error) => {
  console.error('SMOKE_SEARCH FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
