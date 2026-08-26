import { createContext, useContext, type ReactNode } from 'react';

/**
 * Stand-in for `react-native-safe-area-context` under the render harness.
 *
 * Two separate failures sit behind this one stub, and only the first is
 * obvious. The package declares `"react-native": "src/index.tsx"`, so
 * resolving it drags Flow-typed React Native sources back into the graph and
 * the spec dies on `SyntaxError: Unexpected token 'typeof'` before running —
 * the same entry-point shape as `react-native-svg`. Pointing at the published
 * ESM build clears that, and then the real `SafeAreaProvider` renders
 * `NativeSafeAreaProvider`, a native host component, which reaches react-dom
 * as a DOM tag carrying a React Native style array and throws
 * `Cannot set property 0 of #<CSSStyleDeclaration>` — the identical crash the
 * SVG stub exists for.
 *
 * There is nothing to measure in happy-dom anyway: the real provider learns
 * its insets from a native layout event that never fires here, so a provider
 * left to measure would hang on zero rather than throw. Fixed metrics are both
 * the only workable answer and the more useful one — a notch is the case worth
 * having as the default, since flat-zero insets hide exactly the top-inset
 * bugs a sticky header has.
 */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Metrics {
  frame: { x: number; y: number; width: number; height: number };
  insets: EdgeInsets;
}

const FALLBACK: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

const SafeAreaContext = createContext<Metrics>(FALLBACK);

export function SafeAreaProvider({
  children,
  initialMetrics,
}: {
  children: ReactNode;
  initialMetrics?: Metrics | null;
}) {
  return (
    <SafeAreaContext.Provider value={initialMetrics ?? FALLBACK}>
      {children}
    </SafeAreaContext.Provider>
  );
}

export function useSafeAreaInsets(): EdgeInsets {
  return useContext(SafeAreaContext).insets;
}

export function useSafeAreaFrame(): Metrics['frame'] {
  return useContext(SafeAreaContext).frame;
}

export const initialWindowMetrics = FALLBACK;
