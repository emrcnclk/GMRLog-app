/**
 * Startup orchestration helpers (D3.15) — parallelize independent bootstrap work.
 */

export async function runParallelBootstrap(tasks: readonly (() => Promise<void>)[]): Promise<void> {
  await Promise.all(tasks.map((task) => task()));
}

/** Provider mount order (documented SSOT for audits). */
export const STARTUP_PROVIDER_ORDER = [
  'GestureHandlerRootView',
  'RootErrorBoundary',
  'SafeAreaProvider',
  'AppThemeProvider',
  'LocalizationProvider',
  'AppQueryProvider (PersistQueryClient + hydration)',
  'AuthProvider',
  'ApiProvider',
  'AuthSessionBootstrap (SecureStore)',
  'AppMotionProvider',
  'AccessibilityFoundationProvider',
  'ToastHost',
  'BottomSheetModalProvider',
  'ConnectivityBridge (NetInfo + OfflineBanner + recovery)',
] as const;
