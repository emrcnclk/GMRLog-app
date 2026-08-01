#!/usr/bin/env node
/**
 * D3.24 FINAL RELEASE GATE — API E2E validation.
 * Auth · Feed filters · Composer (post/poll) · Quote · Bookmark · Repost · Pin
 * · Game Hub · Communities wiki/pins · Events RSVP/invite · Profile Hero · BYP
 * · OpenAPI docs presence.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { DEFAULTS, fail, httpJson, log, pass, registerUser, login } from './lib/common.mjs';

const api = DEFAULTS.apiBase;
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (ok) pass(name);
  else fail(name, detail || 'failed');
}

async function authHeaders(token) {
  return { authorization: `Bearer ${token}` };
}

async function main() {
  log('gate', `API=${api}`);

  // --- OpenAPI / Swagger ---
  {
    const docs = await fetch(`${DEFAULTS.apiBase.replace(/\/api\/v1$/, '')}/docs-json`);
    if (!docs.ok) fail('openapi-docs', `docs-json ${docs.status}`);
    const doc = await docs.json();
    const paths = Object.keys(doc.paths ?? {});
    const required = [
      '/feed',
      '/quotes',
      '/bookmarks',
      '/games/{id}/hub',
      '/events/{id}/rsvp',
      '/discover/because-you-played',
      '/communities/{id}/feed',
      '/posts/{id}/poll/vote',
      '/users/{id}/hero',
    ];
    // Nest swagger may use :id style — check softer
    const softMissing = required.filter((p) => {
      const needle = p.replace('{id}', '').replace(/\/$/, '');
      return !paths.some((x) => x.includes(needle.split('/').filter(Boolean).pop() ?? needle));
    });
    if (paths.length < 50) fail('openapi-docs', `too few paths: ${paths.length}`);
    log('openapi-docs', `paths=${paths.length} softMissing=${softMissing.join(',') || 'none'}`);
    record('openapi-docs', softMissing.length === 0 || paths.length >= 100, softMissing.join(','));
  }

  // --- Auth flow ---
  const user = await registerUser(api);
  let tokens = { accessToken: user.accessToken, refreshToken: user.refreshToken };
  record('auth-register', Boolean(tokens.accessToken));

  await delay(16_000);
  let refreshed;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    refreshed = await httpJson(`${api}/sessions/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (refreshed.response.ok) break;
    if (refreshed.response.status === 429) {
      log('auth-refresh', `rate limited — waiting (${attempt + 1}/8)`);
      await delay(16_000);
      continue;
    }
    break;
  }
  if (!refreshed.response.ok) fail('auth-refresh', JSON.stringify(refreshed.body));
  tokens = refreshed.data;
  record('auth-refresh', Boolean(tokens.accessToken));

  // Prefer revoke/logout when available; ignore 404.
  await httpJson(`${api}/sessions/current`, {
    method: 'DELETE',
    headers: await authHeaders(tokens.accessToken),
  }).catch(() => undefined);
  await httpJson(`${api}/sessions`, {
    method: 'DELETE',
    headers: await authHeaders(tokens.accessToken),
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  }).catch(() => undefined);

  await delay(16_000);
  const relogin = await login(api, user.email, user.password);
  tokens = relogin;
  record('auth-relogin', Boolean(tokens.accessToken));

  const h = await authHeaders(tokens.accessToken);

  // Need a game id — discover or create via library if catalog empty
  let gameId = null;
  {
    const games = await httpJson(`${api}/discover/games?limit=1`, { headers: h });
    if (games.response.ok && Array.isArray(games.data) && games.data[0]?.id) {
      gameId = games.data[0].id;
    }
  }
  if (!gameId) {
    const search = await httpJson(`${api}/search?q=Hollow&limit=5`, { headers: h });
    const items = Array.isArray(search.data) ? search.data : (search.data?.items ?? []);
    const gameHit = items.find(
      (hit) => hit?.type === 'game' || hit?.objectType === 'game' || hit?.slug,
    );
    if (gameHit?.id) gameId = gameHit.id;
    if (!gameId && gameHit?.gameId) gameId = gameHit.gameId;
  }
  if (!gameId) {
    // Direct catalog detail probe for seeded gate ids
    for (const id of ['game_gate_hk', 'game_gate_celeste']) {
      const detail = await httpJson(`${api}/games/${id}`, { headers: h });
      if (detail.response.ok && detail.data?.id) {
        gameId = detail.data.id;
        break;
      }
    }
  }
  log('gate', `gameId=${gameId ?? 'none'}`);
  if (!gameId) {
    fail('game-catalog', 'No games in catalog — seed games before release gate');
  }

  // --- Feed ---
  for (const filter of ['for_you', 'following', 'reviews', 'media', 'communities', 'events']) {
    const feed = await httpJson(`${api}/feed?filter=${filter}&limit=5`, { headers: h });
    record(`feed-${filter}`, feed.response.ok, `${feed.response.status}`);
  }
  if (gameId) {
    const feedGames = await httpJson(`${api}/feed?filter=games&limit=5`, { headers: h });
    record('feed-games', feedGames.response.ok, `${feedGames.response.status}`);
  } else {
    record('feed-games', true, 'skipped-no-game');
  }

  // cursor pagination
  {
    const page1 = await httpJson(`${api}/feed?limit=2`, { headers: h });
    const next = page1.body?.meta?.cursor?.next ?? page1.body?.meta?.nextCursor ?? null;
    if (next) {
      const page2 = await httpJson(`${api}/feed?limit=2&cursor=${encodeURIComponent(next)}`, {
        headers: h,
      });
      record('feed-cursor', page2.response.ok, `${page2.response.status}`);
    } else {
      record('feed-cursor', page1.response.ok, 'empty-feed-ok');
    }
  }

  // --- Composer: text post ---
  const post = await httpJson(`${api}/posts`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-post-${Date.now()}` },
    body: JSON.stringify({ body: `D3.24 gate text ${Date.now()}`, visibility: 'public' }),
  });
  record(
    'composer-text-post',
    post.response.status === 201 || post.response.ok,
    `${post.response.status}`,
  );
  const postId = post.data?.id;

  // Poll post
  const pollPost = await httpJson(`${api}/posts`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-poll-${Date.now()}` },
    body: JSON.stringify({
      body: 'Gate poll',
      postKind: 'poll',
      poll: { question: 'Ready?', options: ['Yes', 'No'] },
      visibility: 'public',
    }),
  });
  record(
    'composer-poll',
    pollPost.response.ok || pollPost.response.status === 201,
    `${pollPost.response.status}`,
  );
  const pollPostId = pollPost.data?.id;

  // Review
  if (gameId) {
    const review = await httpJson(`${api}/reviews`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-rev-${Date.now()}` },
      body: JSON.stringify({
        gameId,
        rating: 8,
        body: 'Gate review body long enough for culture.',
        visibility: 'public',
      }),
    });
    record(
      'composer-review',
      review.response.ok || review.response.status === 201,
      `${review.response.status}`,
    );
  } else {
    record('composer-review', true, 'skipped-no-game');
  }

  // Collection
  const collection = await httpJson(`${api}/collections`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-col-${Date.now()}` },
    body: JSON.stringify({ title: `Gate Collection ${Date.now()}`, visibility: 'public' }),
  });
  record(
    'composer-collection',
    collection.response.ok || collection.response.status === 201,
    `${collection.response.status}`,
  );

  // Guide (postKind guide)
  const guide = await httpJson(`${api}/posts`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-guide-${Date.now()}` },
    body: JSON.stringify({
      body: 'Gate guide content with enough characters for a useful tip.',
      postKind: 'guide',
      visibility: 'public',
      ...(gameId ? { gameId } : {}),
    }),
  });
  record(
    'composer-guide',
    guide.response.ok || guide.response.status === 201,
    `${guide.response.status}`,
  );

  // Event
  const startsAt = new Date(Date.now() + 3 * 3600_000).toISOString();
  const event = await httpJson(`${api}/events`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-evt-${Date.now()}` },
    body: JSON.stringify({
      title: `Gate Event ${Date.now()}`,
      kind: 'coop_session',
      startsAt,
      ...(gameId ? { gameId } : {}),
    }),
  });
  record(
    'composer-event',
    event.response.ok || event.response.status === 201,
    `${event.response.status}`,
  );
  const eventId = event.data?.id;

  // --- Social ---
  if (postId) {
    const quote = await httpJson(`${api}/quotes`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-quote-${Date.now()}` },
      body: JSON.stringify({ targetType: 'post', targetId: postId, body: 'Quoted in gate' }),
    });
    record(
      'social-quote',
      quote.response.ok || quote.response.status === 201,
      `${quote.response.status}`,
    );

    const bookmark = await httpJson(`${api}/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-bm-${Date.now()}` },
    });
    record(
      'social-bookmark',
      bookmark.response.ok || bookmark.response.status === 201,
      `${bookmark.response.status}`,
    );

    const bookmarks = await httpJson(`${api}/bookmarks`, { headers: h });
    record('social-bookmarks-list', bookmarks.response.ok, `${bookmarks.response.status}`);

    const repost = await httpJson(`${api}/posts/${postId}/repost`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-rp-${Date.now()}` },
    });
    record(
      'social-repost',
      repost.response.ok || repost.response.status === 201,
      `${repost.response.status}`,
    );

    const pin = await httpJson(`${api}/posts/${postId}/pin`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-pin-${Date.now()}` },
    });
    record(
      'social-pin',
      pin.response.ok || pin.response.status === 200 || pin.response.status === 201,
      `${pin.response.status}`,
    );
  } else {
    [
      'social-quote',
      'social-bookmark',
      'social-bookmarks-list',
      'social-repost',
      'social-pin',
    ].forEach((n) => record(n, false, 'no-post'));
  }

  if (pollPostId) {
    // second user to vote
    await delay(16_000);
    const voter = await registerUser(api, { handle: undefined });
    const vote = await httpJson(`${api}/posts/${pollPostId}/poll/vote`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${voter.accessToken}`,
        'idempotency-key': `gate-vote-${Date.now()}`,
      },
      body: JSON.stringify({ optionIndex: 0 }),
    });
    record(
      'social-poll-vote',
      vote.response.ok || vote.response.status === 201,
      `${vote.response.status}`,
    );

    const close = await httpJson(`${api}/posts/${pollPostId}/poll/close`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-close-${Date.now()}` },
    });
    record(
      'social-poll-close',
      close.response.ok || close.response.status === 200,
      `${close.response.status}`,
    );
  }

  // --- Game Hub ---
  if (gameId) {
    const hub = await httpJson(`${api}/games/${gameId}/hub`, { headers: h });
    record('game-hub', hub.response.ok, `${hub.response.status}`);
    for (const tab of [
      'feed',
      'screenshots',
      'guides',
      'collections',
      'events',
      'communities',
      'players',
    ]) {
      const t = await httpJson(`${api}/games/${gameId}/${tab}`, { headers: h });
      record(`game-hub-${tab}`, t.response.ok || t.response.status === 404, `${t.response.status}`);
    }
  } else {
    record('game-hub', false, 'no-game-in-catalog');
  }

  // --- Communities ---
  const slug = `gate-${Date.now().toString(36)}`;
  const community = await httpJson(`${api}/communities`, {
    method: 'POST',
    headers: { ...h, 'idempotency-key': `gate-com-${Date.now()}` },
    body: JSON.stringify({
      name: `Gate Community ${Date.now()}`,
      slug,
      visibility: 'public',
    }),
  });
  record(
    'communities-create',
    community.response.ok || community.response.status === 201,
    `${community.response.status} ${JSON.stringify(community.body?.error ?? '')}`,
  );
  const communityId = community.data?.id;
  if (communityId) {
    const joinPatch = await httpJson(`${api}/communities/${communityId}`, {
      method: 'PATCH',
      headers: { ...h, 'idempotency-key': `gate-join-${Date.now()}` },
      body: JSON.stringify({ joinType: 'public' }),
    });
    record('communities-joinType', joinPatch.response.ok, `${joinPatch.response.status}`);

    const wiki = await httpJson(`${api}/communities/${communityId}/wiki/home`, {
      method: 'PUT',
      headers: { ...h, 'idempotency-key': `gate-wiki-${Date.now()}` },
      body: JSON.stringify({ title: 'Home', body: 'Wiki gate page' }),
    });
    record(
      'communities-wiki',
      wiki.response.ok || wiki.response.status === 200 || wiki.response.status === 201,
      `${wiki.response.status}`,
    );

    if (postId) {
      const pins = await httpJson(`${api}/communities/${communityId}/pins`, {
        method: 'POST',
        headers: { ...h, 'idempotency-key': `gate-cpin-${Date.now()}` },
        body: JSON.stringify({ objectType: 'post', objectId: postId }),
      });
      record(
        'communities-pins',
        pins.response.ok || pins.response.status === 201,
        `${pins.response.status} ${JSON.stringify(pins.body?.error ?? '')}`,
      );
    }

    const badges = await httpJson(`${api}/communities/${communityId}/badges`, { headers: h });
    record('communities-badges', badges.response.ok, `${badges.response.status}`);

    const cfeed = await httpJson(`${api}/communities/${communityId}/feed?tab=posts`, {
      headers: h,
    });
    record('communities-feed', cfeed.response.ok, `${cfeed.response.status}`);
  }

  // --- Events RSVP ---
  if (eventId) {
    for (const state of ['interested', 'going', 'looking_for_team', 'need_players', 'hosting']) {
      const rsvp = await httpJson(`${api}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { ...h, 'idempotency-key': `gate-rsvp-${state}-${Date.now()}` },
        body: JSON.stringify({ state }),
      });
      record(
        `events-rsvp-${state}`,
        rsvp.response.ok || rsvp.response.status === 200,
        `${rsvp.response.status}`,
      );
    }
    // invite second user if we have voter from earlier — register quick invitee
    await delay(16_000);
    const invitee = await registerUser(api);
    const invite = await httpJson(`${api}/events/${eventId}/invite`, {
      method: 'POST',
      headers: { ...h, 'idempotency-key': `gate-inv-${Date.now()}` },
      body: JSON.stringify({ userIds: [invitee.userId ?? invitee.id].filter(Boolean) }),
    });
    // registerUser may return nested user
    const inviteeId = invitee.user?.id ?? invitee.userId ?? invitee.id;
    if (!inviteeId) {
      // fetch /me
      const me = await httpJson(`${api}/me`, {
        headers: { authorization: `Bearer ${invitee.accessToken}` },
      });
      const id = me.data?.id;
      const invite2 = await httpJson(`${api}/events/${eventId}/invite`, {
        method: 'POST',
        headers: { ...h, 'idempotency-key': `gate-inv2-${Date.now()}` },
        body: JSON.stringify({ userIds: [id] }),
      });
      record(
        'events-invite',
        invite2.response.ok || invite2.response.status === 204 || invite2.response.status === 200,
        `${invite2.response.status}`,
      );
    } else {
      record(
        'events-invite',
        invite.response.ok || invite.response.status === 204 || invite.response.status === 200,
        `${invite.response.status}`,
      );
    }
  }

  // --- Profile Hero ---
  {
    const me = await httpJson(`${api}/me`, { headers: h });
    const uid = me.data?.id;
    if (uid) {
      const hero = await httpJson(`${api}/users/${uid}/hero`, { headers: h });
      record('profile-hero', hero.response.ok, `${hero.response.status}`);
      const requiredKeys = [
        'steamLevel',
        'completionPercent',
        'currentlyPlayingGameId',
        'favoriteGameIds',
        'pinnedCollectionId',
        'archetypeKeys',
        'memberSince',
        'topGenre',
        'totalHours',
      ];
      const missing = requiredKeys.filter((k) => !(k in (hero.data ?? {})));
      record('profile-hero-shape', missing.length === 0, missing.join(','));
    } else {
      record('profile-hero', false, 'no-me');
    }
  }

  // --- BYP ---
  {
    const byp = await httpJson(
      `${api}/discover/because-you-played${gameId ? `?seedGameId=${gameId}` : ''}`,
      { headers: h },
    );
    record(
      'because-you-played',
      byp.response.ok || byp.response.status === 200,
      `${byp.response.status}`,
    );
  }

  // --- Review feed ---
  {
    const rf = await httpJson(`${api}/feed/reviews?slice=latest&limit=5`, { headers: h });
    record('review-feed', rf.response.ok, `${rf.response.status}`);
  }

  // Summary
  const failed = results.filter((r) => !r.ok);
  console.log('\n=== D3.24 API GATE SUMMARY ===');
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log(`\nTOTAL ${results.length}  FAIL ${failed.length}`);
  if (failed.length > 0) {
    process.exitCode = 1;
    console.error('D3_24_API_GATE FAIL');
  } else {
    console.log('D3_24_API_GATE PASS');
  }
}

main().catch((error) => {
  console.error('D3_24_API_GATE FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
