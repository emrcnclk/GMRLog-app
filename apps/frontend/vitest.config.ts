import { defineConfig } from 'vitest/config';

/**
 * No config existed before this file — vitest ran on its built-in defaults.
 * The only change made here is the one this file exists for: excluding
 * `e2e/**`, which is Playwright's directory (10.4), not vitest's. `exclude`
 * fully replaces vitest's default array rather than extending it, so the
 * defaults are restated verbatim (vitest v3's own list) to avoid silently
 * changing what the existing ~619 frontend unit tests match.
 */
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'e2e/**',
    ],
  },
});
