import { noopAnalytics, noopCrashReporting, noopPerformanceMonitoring } from './noop-adapters';
import type {
  AnalyticsAdapter,
  CrashReportingAdapter,
  PerformanceMonitoringAdapter,
} from './types';

export interface MonitoringServices {
  crash: CrashReportingAdapter;
  analytics: AnalyticsAdapter;
  performance: PerformanceMonitoringAdapter;
}

let services: MonitoringServices = {
  crash: noopCrashReporting,
  analytics: noopAnalytics,
  performance: noopPerformanceMonitoring,
};

/** Inject adapters (tests / future provider wiring). Defaults remain no-op. */
export function configureMonitoring(partial: Partial<MonitoringServices>): void {
  services = {
    crash: partial.crash ?? services.crash,
    analytics: partial.analytics ?? services.analytics,
    performance: partial.performance ?? services.performance,
  };
}

export function getMonitoring(): MonitoringServices {
  return services;
}

export function resetMonitoring(): void {
  services = {
    crash: noopCrashReporting,
    analytics: noopAnalytics,
    performance: noopPerformanceMonitoring,
  };
}
