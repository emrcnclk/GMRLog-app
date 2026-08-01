/**
 * D3.22 Discovery smoke — deterministic /discover surfaces.
 * Usage: node scripts/release/smoke-discover.mjs
 * Requires API at SMOKE_BASE_URL (default http://127.0.0.1:3000).
 */
const base = (process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

const paths = [
  '/discover',
  '/discover/games',
  '/discover/trending?window=7d',
  '/discover/popular',
  '/discover/hidden-gems',
  '/discover/recommended',
  '/discover/collections',
  '/discover/communities',
  '/discover/events',
];

async function main() {
  const failures = [];
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        failures.push(`${path} → ${res.status}`);
        continue;
      }
      const body = await res.json();
      if (body?.data === undefined) {
        failures.push(`${path} → missing data envelope`);
      } else {
        console.log(`OK ${path}`);
      }
    } catch (error) {
      failures.push(`${path} → ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    console.error('DISCOVERY_SMOKE_FAIL');
    for (const row of failures) {
      console.error(row);
    }
    process.exit(1);
  }
  console.log('DISCOVERY_SMOKE_PASS');
}

main();
