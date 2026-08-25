/**
 * Test setup for the render specs (`*.render.spec.tsx`).
 *
 * Two things have to be true before a component can be mounted at all, and
 * both are environment plumbing rather than anything the app does:
 *
 * 1. `react-native` is aliased to `react-native-web` in `vitest.config.ts`.
 *    React Native's own `index.js` is Flow-typed (`import typeof …`), which
 *    Vite's parser rejects outright — every attempt to import a component
 *    failed with `Parse failure: Expected 'from', got 'typeOf'` before the
 *    alias. Aliasing is also the honest choice: the web build is what these
 *    specs are asserting about, and it is what RNW renders in production.
 *
 * 2. `expo-modules-core` reads `globalThis.expo` at module scope and throws
 *    on a bare Node/DOM global. The shim below is the smallest object that
 *    lets it load; it deliberately implements nothing, because a spec that
 *    depends on real native module behaviour should not be a render spec.
 */
interface ExpoGlobalShim {
  EventEmitter: typeof EventTarget;
  NativeModule: typeof EventTarget;
  SharedObject: ObjectConstructor;
  SharedRef: ObjectConstructor;
  modules: Record<string, unknown>;
  uuidv4: () => string;
  uuidv5: () => string;
  getViewConfig: () => null;
  reloadAppAsync: () => Promise<void>;
}

const expoShim: ExpoGlobalShim = {
  EventEmitter: EventTarget,
  NativeModule: EventTarget,
  SharedObject: Object,
  SharedRef: Object,
  modules: {},
  uuidv4: () => '00000000-0000-4000-8000-000000000000',
  uuidv5: () => '00000000-0000-5000-8000-000000000000',
  getViewConfig: () => null,
  reloadAppAsync: () => Promise.resolve(),
};

(globalThis as unknown as { expo: ExpoGlobalShim }).expo = expoShim;

/**
 * `@testing-library/react` only self-registers its `afterEach(cleanup)` when
 * vitest runs with `globals: true`, which this project does not. Without it,
 * renders from earlier tests stay mounted and queries start matching two
 * copies of the same element.
 *
 * Guarded on `document`: this setup file also runs for the ~139 node-
 * environment specs, which have no DOM and must not pay for react-dom.
 */
if (typeof document !== 'undefined') {
  const { afterEach } = await import('vitest');
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => {
    cleanup();
  });
}
