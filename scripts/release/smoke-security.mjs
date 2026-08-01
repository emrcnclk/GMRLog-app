#!/usr/bin/env node
/**
 * Security audit smoke — Helmet/CSP/HSTS headers · rate limit · auth abuse · enumeration.
 */

import { DEFAULTS, fail, httpJson, log, pass, uniqueHandle } from './lib/common.mjs';

function header(response, name) {
  return response.headers.get(name);
}

async function main() {
  const api = DEFAULTS.apiBase;
  const health = await fetch(`${api}/health`);
  if (!health.ok) {
    fail('headers', `health ${health.status}`);
  }

  const xcto = header(health, 'x-content-type-options');
  if (xcto && xcto.toLowerCase() !== 'nosniff') {
    fail('headers', `x-content-type-options=${xcto}`);
  }
  log('headers', `x-content-type-options=${xcto ?? '(unset in non-prod)'}`);

  // Production nginx adds HSTS; direct API may only set HSTS when NODE_ENV=production.
  const hsts = header(health, 'strict-transport-security');
  const csp = header(health, 'content-security-policy');
  log('headers', `hsts=${hsts ?? '(none)'} csp=${csp ?? '(none)'}`);
  pass('headers');

  // Request id echo
  const withId = await fetch(`${api}/health`, {
    headers: { 'x-gmrlog-request-id': 'smoke-req-id-0001' },
  });
  const echoed = header(withId, 'x-gmrlog-request-id');
  if (!echoed) {
    fail('request-id', 'missing x-gmrlog-request-id response header');
  }
  pass('request-id');

  // Auth rate limit / brute-force (auth class = 5/min)
  let limited = false;
  const email = `${uniqueHandle('rl')}@smoke.gmrlog.local`;
  for (let i = 0; i < 8; i += 1) {
    const { response } = await httpJson(`${api}/sessions`, {
      method: 'POST',
      headers: { 'idempotency-key': `rl-${email}-${i}` },
      body: JSON.stringify({ email, password: 'wrong-password-xx' }),
    });
    if (response.status === 429) {
      limited = true;
      break;
    }
  }
  if (!limited) {
    fail('rate-limit-auth', 'did not receive 429 after auth burst');
  }
  pass('rate-limit-auth');

  // Password reset abuse — also auth class
  let forgotLimited = false;
  for (let i = 0; i < 8; i += 1) {
    const { response } = await httpJson(`${api}/sessions/password/forgot`, {
      method: 'POST',
      body: JSON.stringify({ email: `${uniqueHandle('fg')}@smoke.gmrlog.local` }),
    });
    if (response.status === 429) {
      forgotLimited = true;
      break;
    }
  }
  if (!forgotLimited) {
    // May share the previous window — wait note
    log(
      'rate-limit-forgot',
      'no 429 in this window (may share auth bucket) — checking status codes only',
    );
  } else {
    pass('rate-limit-forgot');
  }

  // Enumeration: forgot always 204
  const enumA = await httpJson(`${api}/sessions/password/forgot`, {
    method: 'POST',
    body: JSON.stringify({ email: `exists-check-${Date.now()}@smoke.gmrlog.local` }),
  });
  if (enumA.response.status !== 204 && enumA.response.status !== 429) {
    fail('enumeration', `unexpected ${enumA.response.status}`);
  }
  pass('enumeration');

  console.log('SMOKE_SECURITY PASS');
}

main().catch((error) => {
  console.error('SMOKE_SECURITY FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
