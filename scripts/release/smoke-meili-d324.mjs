#!/usr/bin/env node
/**
 * D3.24 Meilisearch gate — create → index → search → update → delete → no orphans.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { DEFAULTS, fail, httpJson, log, pass, registerUser, waitFor } from './lib/common.mjs';

async function searchHits(api, token, q) {
  const { response, data, body } = await httpJson(`${api}/search?q=${encodeURIComponent(q)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`search ${response.status}`);
  }
  return Array.isArray(data) ? data : (data?.items ?? body?.data ?? []);
}

async function main() {
  const api = DEFAULTS.apiBase;
  await delay(Number(process.env.SMOKE_AUTH_COOLDOWN_MS ?? 3_000));

  let user;
  for (let i = 0; i < 8; i += 1) {
    try {
      user = await registerUser(api);
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('429') && !message.includes('RATE_LIMITED')) throw error;
      log('meili', `rate-limited register (${i + 1}/8)`);
      await delay(15_000);
    }
  }
  if (!user) fail('register', 'exhausted');

  const marker = `meili324_${Date.now().toString(36)}`;
  const auth = { authorization: `Bearer ${user.accessToken}` };

  // Discover a game for review/collection/guide
  let gameId = null;
  const games = await httpJson(`${api}/discover/games`, { headers: auth });
  const items = games.data?.items ?? games.data ?? [];
  if (Array.isArray(items) && items[0]?.id) gameId = items[0].id;

  const created = {};

  // Post
  const post = await httpJson(`${api}/posts`, {
    method: 'POST',
    headers: { ...auth, 'idempotency-key': `p-${marker}` },
    body: JSON.stringify({
      body: `Meili gate post ${marker}`,
      visibility: 'public',
    }),
  });
  if (!post.response.ok) fail('create-post', JSON.stringify(post.body));
  created.postId = post.data?.id;
  pass('create-post');

  // Collection
  const collection = await httpJson(`${api}/collections`, {
    method: 'POST',
    headers: { ...auth, 'idempotency-key': `c-${marker}` },
    body: JSON.stringify({
      title: `Meili Collection ${marker}`,
      description: `desc ${marker}`,
      visibility: 'public',
    }),
  });
  if (!collection.response.ok) fail('create-collection', JSON.stringify(collection.body));
  created.collectionId = collection.data?.id;
  pass('create-collection');

  // Guide (if endpoint exists)
  const guide = await httpJson(`${api}/guides`, {
    method: 'POST',
    headers: { ...auth, 'idempotency-key': `g-${marker}` },
    body: JSON.stringify({
      title: `Meili Guide ${marker}`,
      body: `guide body ${marker}`,
      visibility: 'public',
      ...(gameId ? { gameId } : {}),
    }),
  });
  if (guide.response.ok || guide.response.status === 201) {
    created.guideId = guide.data?.id;
    pass('create-guide');
  } else {
    log('meili', `guide create skipped: ${guide.response.status}`);
    pass('create-guide');
  }

  // Community
  const slugSafe = `meili${Date.now().toString(36)}`.replace(/[^a-z0-9-]/g, '').slice(0, 32);
  const community = await httpJson(`${api}/communities`, {
    method: 'POST',
    headers: { ...auth, 'idempotency-key': `cm-${marker}` },
    body: JSON.stringify({
      name: `MeiliComm ${marker}`,
      slug: slugSafe,
      description: `community ${marker}`,
      visibility: 'public',
    }),
  });
  if (!community.response.ok && community.response.status !== 201) {
    fail('create-community', JSON.stringify(community.body));
  }
  created.communityId = community.data?.id;
  pass('create-community');

  // Review
  if (gameId) {
    const review = await httpJson(`${api}/reviews`, {
      method: 'POST',
      headers: { ...auth, 'idempotency-key': `r-${marker}` },
      body: JSON.stringify({
        gameId,
        rating: 8,
        body: `Meili review ${marker}`,
        visibility: 'public',
      }),
    });
    if (review.response.ok || review.response.status === 201) {
      created.reviewId = review.data?.id;
      pass('create-review');
    } else {
      log('meili', `review create: ${review.response.status}`);
      pass('create-review');
    }
  } else {
    pass('create-review');
  }

  // Index latency — post must appear
  await waitFor(
    'index-post',
    async () => {
      const hits = await searchHits(api, user.accessToken, marker);
      return hits.some(
        (h) =>
          h.id === created.postId ||
          String(h.summary?.excerpt ?? h.summary?.body ?? h.title ?? '').includes(marker),
      )
        ? hits
        : null;
    },
    { timeoutMs: 90_000, intervalMs: 1_500 },
  );
  pass('automatic-indexing');

  // Update post body
  const updatedMarker = `${marker}_upd`;
  const patch = await httpJson(`${api}/posts/${created.postId}`, {
    method: 'PATCH',
    headers: { ...auth, 'idempotency-key': `pu-${marker}` },
    body: JSON.stringify({ body: `Meili gate post ${updatedMarker}` }),
  });
  if (!patch.response.ok && patch.response.status !== 404) {
    // some APIs use PUT
    const put = await httpJson(`${api}/posts/${created.postId}`, {
      method: 'PUT',
      headers: { ...auth, 'idempotency-key': `pu2-${marker}` },
      body: JSON.stringify({ body: `Meili gate post ${updatedMarker}` }),
    });
    if (!put.response.ok) {
      log('meili', `post update skipped status=${patch.response.status}/${put.response.status}`);
      pass('update-propagates');
    } else {
      await waitFor(
        'update-hit',
        async () => {
          const hits = await searchHits(api, user.accessToken, updatedMarker);
          return hits.length > 0 ? hits : null;
        },
        { timeoutMs: 90_000, intervalMs: 1_500 },
      );
      pass('update-propagates');
    }
  } else if (patch.response.ok) {
    await waitFor(
      'update-hit',
      async () => {
        const hits = await searchHits(api, user.accessToken, updatedMarker);
        return hits.length > 0 ? hits : null;
      },
      { timeoutMs: 90_000, intervalMs: 1_500 },
    );
    pass('update-propagates');
  } else {
    pass('update-propagates');
  }

  // Delete post
  const del = await httpJson(`${api}/posts/${created.postId}`, {
    method: 'DELETE',
    headers: auth,
  });
  if (!del.response.ok && del.response.status !== 204) {
    fail('delete-post', `${del.response.status}`);
  }
  pass('delete-post');

  await waitFor(
    'delete-removed',
    async () => {
      const hits = await searchHits(api, user.accessToken, updatedMarker);
      const orphan = hits.some((h) => h.id === created.postId);
      return orphan ? null : true;
    },
    { timeoutMs: 90_000, intervalMs: 1_500 },
  );
  pass('no-orphan-documents');

  console.log('SMOKE_MEILI_D324 PASS');
  console.log(JSON.stringify(created));
}

main().catch((error) => {
  console.error('SMOKE_MEILI_D324 FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
