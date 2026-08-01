/**
 * Monitoring DI interfaces only (D3.15).
 * Providers are not enabled — adapters stay no-op until a future release wires them.
 */

export interface CrashReportingAdapter {
  readonly name: string;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, context?: Record<string, unknown>) => void;
  setUser: (user: { id: string } | null) => void;
}

export interface AnalyticsAdapter {
  readonly name: string;
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

export interface PerformanceMonitoringAdapter {
  readonly name: string;
  mark: (name: string) => void;
  measure: (name: string, startMark: string, endMark?: string) => void;
  recordMetric: (name: string, value: number, unit?: string) => void;
}
