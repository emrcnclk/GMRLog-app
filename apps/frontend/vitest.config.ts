import { fileURLToPath } from 'node:url';

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
  // The specs are `.tsx`; without this esbuild emits the classic transform and
  // every render fails with `ReferenceError: React is not defined`.
  esbuild: { jsx: 'automatic' },
  // Metro injects `__DEV__`; `expo-modules-core` reads it at module scope and
  // a bare Vite/Node run throws `ReferenceError: __DEV__ is not defined`.
  define: { __DEV__: 'true' },
  resolve: {
    // React Native's `index.js` is Flow-typed (`import typeof …`), which
    // Vite's parser rejects, so *any* spec that reaches `react-native` — even
    // transitively through `@gmrlog/ui` — failed to parse before this alias.
    // That is why the frontend had 139 spec files and not one of them
    // rendered a component. `react-native-web` is plain JS and is what the
    // web build actually runs.
    // Array form with anchored patterns, not the object form: a string alias
    // key matches by *prefix*, so `'react-native'` also rewrote
    // `react-native-web` itself and put the Flow-typed source back in the
    // graph under a different name.
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      // `react-native-svg` is stubbed outright rather than pointed at its
      // published ESM build. That build loads fine, but its `Svg` renders the
      // native view name returned by `codegen-native-component.stub.ts`, so
      // react-dom gets a DOM tag carrying a React Native style *array* and
      // happy-dom throws `Cannot set property 0 of #<CSSStyleDeclaration>`.
      // Every lucide icon goes through this path, which made most of the app
      // unmountable — see the stub for the full chain.
      {
        find: /^react-native-svg$/,
        replacement: fileURLToPath(
          new URL('./test-support/react-native-svg.stub.tsx', import.meta.url),
        ),
      },
      // `react-native-svg` reaches into React Native's Flow-typed source for
      // this one helper, which is meaningless on web.
      {
        find: /^react-native\/Libraries\/Types\/CodegenTypes$/,
        replacement: fileURLToPath(
          new URL('./test-support/codegen-types.stub.ts', import.meta.url),
        ),
      },
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
        replacement: fileURLToPath(
          new URL('./test-support/codegen-native-component.stub.ts', import.meta.url),
        ),
      },
      // `expo-image` calls `requireNativeViewManager` at module scope and
      // throws outside a native runtime, which took down the whole
      // `@gmrlog/ui` barrel (its `Avatar` imports it).
      {
        find: /^expo-image$/,
        replacement: fileURLToPath(new URL('./test-support/expo-image.stub.tsx', import.meta.url)),
      },
    ],
  },
  test: {
    // `expo-modules-core` reads `globalThis.expo` at module scope.
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        // Vitest externalises `node_modules` by default, and an externalised
        // module is loaded by Node directly — which means `resolve.alias`
        // never applies to it and Node chokes on React Native's Flow syntax
        // with a bare `SyntaxError: Unexpected token 'typeof'` and no file to
        // point at. Inlining puts these back through Vite, where the aliases
        // above take effect.
        inline: [/react-native/, /^expo/, /expo-/, /@gmrlog\/ui/, /@react-navigation/],
      },
    },
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
