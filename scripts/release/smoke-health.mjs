#!/usr/bin/env node
/**
 * Health verification — GET /health · /live · /ready (PG + Redis + MinIO + Meili).
 */

import { DEFAULTS, fail, httpJson, log, pass } from './lib/common.mjs';

async function main() {
  const base = DEFAULTS.apiBase;

  const health = await httpJson(`${base}/health`);
  if (!health.response.ok || health.data?.status !== 'ok') {
    fail('health', JSON.stringify(health.body));
  }
  pass('health');

  const live = await httpJson(`${base}/health/live`);
  if (!live.response.ok || live.data?.status !== 'ok') {
    fail('live', JSON.stringify(live.body));
  }
  pass('live');

  const ready = await httpJson(`${base}/health/ready`);
  if (!ready.response.ok || ready.data?.status !== 'ok') {
    fail('ready', JSON.stringify(ready.body));
  }
  const checks = ready.data?.checks ?? {};
  for (const key of ['database', 'redis', 'storage', 'meili']) {
    if (checks[key] !== 'up') {
      fail('ready', `${key}=${String(checks[key])} (expected up)`);
    }
  }
  log('ready', JSON.stringify(checks));
  pass('ready');
  console.log('SMOKE_HEALTH PASS');
}

main().catch((error) => {
  console.error('SMOKE_HEALTH FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
