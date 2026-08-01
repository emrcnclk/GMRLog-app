/**
 * D3.23 smoke — Steam connect / import / sync surfaces.
 * Usage: node scripts/release/smoke-integrations.mjs
 * Requires API at SMOKE_BASE_URL and auth token SMOKE_ACCESS_TOKEN.
 */
const base = (process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const token = process.env.SMOKE_ACCESS_TOKEN ?? '';

async function req(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function main() {
  const failures = [];

  const providers = await req('GET', '/integrations/providers');
  if (providers.status !== 200) {
    failures.push(`providers → ${providers.status}`);
  } else {
    console.log('OK providers');
  }

  if (!token) {
    console.log('SKIP auth-required checks (set SMOKE_ACCESS_TOKEN)');
  } else {
    const status = await req('GET', '/integrations/steam/status');
    if (status.status !== 200) {
      failures.push(`steam/status → ${status.status}`);
    } else {
      console.log('OK steam/status');
    }

    const list = await req('GET', '/integrations');
    if (list.status !== 200) {
      failures.push(`integrations → ${list.status}`);
    } else {
      console.log('OK integrations');
    }

    const history = await req('GET', '/integrations/history');
    if (history.status !== 200) {
      failures.push(`history → ${history.status}`);
    } else {
      console.log('OK history');
    }
  }

  if (failures.length > 0) {
    console.error('INTEGRATIONS_SMOKE_FAIL');
    for (const row of failures) console.error(row);
    process.exit(1);
  }
  console.log('INTEGRATIONS_SMOKE_PASS');
}

main();
