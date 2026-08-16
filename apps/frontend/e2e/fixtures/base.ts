import { test as base, expect } from '@playwright/test';

/**
 * `@react-native-community/netinfo`'s web fallback (`nativeModule.web.js`)
 * maps `isConnected` straight to `navigator.onLine` — nothing else. On the
 * GitHub Actions runner's headless Chromium, `navigator.onLine` reported
 * `false` from first paint, which `useConnectivityMonitor` (`apps/frontend/
 * src/connectivity/use-connectivity-monitor.ts`) trusts as "no interface" and
 * latches the app into its offline banner before `probeApiReachability` (a
 * real ping against the backend) ever runs — every network-dependent flow in
 * this suite failed on the real runner for this one shared reason. Not
 * reproduced locally (Windows Playwright reports `navigator.onLine: true`),
 * so this is an environment quirk of that sandbox, not a real product bug —
 * same class as 10.3's `document.visibilityState` finding, a different
 * property of the same kind of headless/CI browser context. `setOffline(false)`
 * drives Chromium's own CDP `Network.emulateNetworkConditions`, which
 * overrides `navigator.onLine` directly rather than trusting whatever the
 * sandbox's real interface reports.
 */
export const test = base.extend({
  page: async ({ page, context }, use) => {
    await context.setOffline(false);
    await use(page);
  },
});

export { expect };
