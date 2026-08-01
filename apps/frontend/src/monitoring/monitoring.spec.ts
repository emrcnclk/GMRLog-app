import { describe, expect, it, beforeEach } from 'vitest';

import {
  configureMonitoring,
  getMonitoring,
  noopAnalytics,
  noopCrashReporting,
  noopPerformanceMonitoring,
  resetMonitoring,
} from './index';

describe('monitoring adapters', () => {
  beforeEach(() => {
    resetMonitoring();
  });

  it('defaults to noop adapters', () => {
    const services = getMonitoring();
    expect(services.crash.name).toBe(noopCrashReporting.name);
    expect(services.analytics.name).toBe(noopAnalytics.name);
    expect(services.performance.name).toBe(noopPerformanceMonitoring.name);
  });

  it('accepts dependency injection without enabling providers', () => {
    let captured: unknown;
    configureMonitoring({
      crash: {
        name: 'test-crash',
        captureException: (error) => {
          captured = error;
        },
        captureMessage: () => undefined,
        setUser: () => undefined,
      },
    });
    getMonitoring().crash.captureException(new Error('boom'));
    expect(captured).toBeInstanceOf(Error);
    expect(getMonitoring().analytics.name).toBe('noop-analytics');
  });
});
