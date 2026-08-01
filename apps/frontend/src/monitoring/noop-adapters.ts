import type {
  AnalyticsAdapter,
  CrashReportingAdapter,
  PerformanceMonitoringAdapter,
} from './types';

function noop(): void {
  // Intentionally empty — providers not enabled in D3.15.
}

export const noopCrashReporting: CrashReportingAdapter = {
  name: 'noop-crash',
  captureException: noop,
  captureMessage: noop,
  setUser: noop,
};

export const noopAnalytics: AnalyticsAdapter = {
  name: 'noop-analytics',
  track: noop,
  identify: noop,
  reset: noop,
};

export const noopPerformanceMonitoring: PerformanceMonitoringAdapter = {
  name: 'noop-performance',
  mark: noop,
  measure: noop,
  recordMetric: noop,
};
