import { defineConfig, devices } from '@playwright/test';

const PORT = '8081';
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * 10.4 — E2E over the five critical paths (sign up, sign in, log a game,
 * view a profile, send a message). Drives the real RNW web build in a real
 * Chromium tab: 10.3 root-caused that the verification pane used elsewhere in
 * this project always reports `document.visibilityState: 'hidden'`, which
 * suspends `requestAnimationFrame` and can silently gate functional code
 * (TanStack Query's retryer, per the standing decision in TASKS.md). A
 * Playwright-launched page is a normal foregrounded tab, not that pane, so it
 * does not inherit that failure class — and no spec here waits on animation
 * completion regardless, only on functional signals (URL, network, text).
 *
 * `workers: 1` — /sessions and /sessions/register are rate-limited routes
 * (CLAUDE.md, `RATE_LIMIT_REDIS_UNAVAILABLE` / 429 elsewhere in this app).
 * Running specs in parallel would race real auth traffic against that limiter
 * for no benefit; five short specs run serially in well under the limit.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter:
    process.env.CI !== undefined ? [['line'], ['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: require.resolve('./global-setup.ts'),
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // CLAUDE.md's own trap: `preview_start` can bind this port and then
    // silently die within a minute. Playwright's `webServer` spawns and
    // supervises the process itself (not through that harness path), and
    // fails the run loudly if the port never comes up — it does not share
    // that failure mode, but the flag that avoids the *documented* trap
    // (CI=1) is kept anyway since it's what disables Metro's interactive
    // menu, which a supervised child process cannot answer.
    command: 'pnpm exec expo start --web --port 8081',
    env: { CI: '1', EXPO_NO_TELEMETRY: '1' },
    url: baseURL,
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120_000,
  },
});
