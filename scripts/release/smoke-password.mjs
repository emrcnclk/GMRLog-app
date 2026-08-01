#!/usr/bin/env node
/**
 * Password reset smoke — forgot → Mailpit → reset → old refresh revoked.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { DEFAULTS, fail, httpJson, log, pass, registerUser, waitFor } from './lib/common.mjs';

async function findResetToken(email) {
  const api = DEFAULTS.mailpitApi.replace(/\/$/, '');
  const { response, body } = await httpJson(
    `${api}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
  );
  if (!response.ok) {
    throw new Error(`mailpit search ${response.status}`);
  }
  const messages = body?.messages ?? [];
  for (const message of messages) {
    const detail = await httpJson(`${api}/api/v1/message/${message.ID}`);
    const text = detail.body?.Text ?? detail.body?.HTML ?? '';
    const match = /[?&]token=([a-f0-9-]{36})/i.exec(String(text));
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

async function main() {
  const api = DEFAULTS.apiBase;
  await delay(Number(process.env.SMOKE_AUTH_COOLDOWN_MS ?? 65_000));

  const user = await registerUser(api);
  const oldRefresh = user.refreshToken;
  log('password', `user ${user.email}`);

  let forgot = await httpJson(`${api}/sessions/password/forgot`, {
    method: 'POST',
    body: JSON.stringify({ email: user.email }),
  });
  if (forgot.response.status === 429) {
    await delay(65_000);
    forgot = await httpJson(`${api}/sessions/password/forgot`, {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    });
  }
  if (forgot.response.status !== 204) {
    fail('forgot', `status ${forgot.response.status}`);
  }
  pass('forgot');

  const enumCheck = await httpJson(`${api}/sessions/password/forgot`, {
    method: 'POST',
    body: JSON.stringify({ email: `missing-${Date.now()}@smoke.gmrlog.local` }),
  });
  if (enumCheck.response.status !== 204 && enumCheck.response.status !== 429) {
    fail('enumeration', `unexpected ${enumCheck.response.status}`);
  }
  pass('enumeration');

  const token = await waitFor('mailpit-token', async () => findResetToken(user.email), {
    timeoutMs: 30_000,
    intervalMs: 1_000,
  });
  log('mailpit', `token=${token.slice(0, 8)}…`);
  pass('mailpit');

  await delay(15_000);
  const newPassword = 'SmokeResetPass99';
  let reset = await httpJson(`${api}/sessions/password/reset`, {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword }),
  });
  if (reset.response.status === 429) {
    await delay(65_000);
    reset = await httpJson(`${api}/sessions/password/reset`, {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
  }
  if (reset.response.status !== 204) {
    fail('reset', `status ${reset.response.status} ${JSON.stringify(reset.body)}`);
  }
  pass('reset');

  const oldRefreshRes = await httpJson(`${api}/sessions/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: oldRefresh }),
  });
  if (oldRefreshRes.response.ok) {
    fail('revoke', 'old refresh token still works');
  }
  pass('revoke');

  await delay(15_000);
  let loggedIn = false;
  for (let i = 0; i < 8; i += 1) {
    const loginRes = await httpJson(`${api}/sessions`, {
      method: 'POST',
      headers: { 'idempotency-key': `login-after-reset-${user.handle}-${i}` },
      body: JSON.stringify({ email: user.email, password: newPassword }),
    });
    if (loginRes.response.ok) {
      loggedIn = true;
      break;
    }
    if (loginRes.response.status === 429) {
      log('login-new-password', `rate limited — waiting (${i + 1}/8)`);
      await delay(15_000);
      continue;
    }
    fail('login-new-password', JSON.stringify(loginRes.body));
  }
  if (!loggedIn) {
    fail('login-new-password', 'exhausted rate-limit retries');
  }
  pass('login-new-password');
  console.log('SMOKE_PASSWORD PASS');
}

main().catch((error) => {
  console.error('SMOKE_PASSWORD FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
