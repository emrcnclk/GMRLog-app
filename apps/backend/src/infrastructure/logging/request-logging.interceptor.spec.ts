import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { MetricsService } from '../metrics/metrics.service';

import { AppLogger } from './app-logger.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

function createContext(headers: Record<string, string | string[] | undefined> = {}) {
  const request = {
    id: 'req-default',
    method: 'GET',
    url: '/health',
    headers,
  };
  const reply = { statusCode: 200 };
  return {
    getType: () => 'http' as const,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  };
}

describe('RequestLoggingInterceptor', () => {
  it('logs requestId, correlationId, and durationMs on success', async () => {
    const event = vi.fn();
    const logger = { event } as unknown as AppLogger;
    const metrics = { recordHttpRequest: vi.fn() } as unknown as MetricsService;
    const interceptor = new RequestLoggingInterceptor(logger, metrics);

    await new Promise<void>((resolve, reject) => {
      interceptor
        .intercept(createContext({ 'x-gmrlog-correlation-id': 'corr-1' }) as never, {
          handle: () => of({ ok: true }),
        })
        .subscribe({
          next: () => undefined,
          error: reject,
          complete: resolve,
        });
    });

    expect(metrics.recordHttpRequest).toHaveBeenCalledOnce();
    expect(event).toHaveBeenCalledWith(
      'info',
      expect.objectContaining({
        requestId: 'req-default',
        correlationId: 'corr-1',
        durationMs: expect.any(Number),
        statusCode: 200,
      }),
      'request completed',
    );
  });

  it('falls back to request id and supports array correlation headers', async () => {
    const event = vi.fn();
    const logger = { event } as unknown as AppLogger;
    const metrics = { recordHttpRequest: vi.fn() } as unknown as MetricsService;
    const interceptor = new RequestLoggingInterceptor(logger, metrics);

    await new Promise<void>((resolve) => {
      interceptor
        .intercept(
          createContext({ 'x-gmrlog-correlation-id': ['  corr-array  ', 'other'] }) as never,
          {
            handle: () => throwError(() => new Error('boom')),
          },
        )
        .subscribe({
          error: () => resolve(),
        });
    });

    expect(event).toHaveBeenCalledWith(
      'warn',
      expect.objectContaining({
        correlationId: 'corr-array',
        error: 'boom',
      }),
      'request failed',
    );
  });

  it('passes through non-http contexts', () => {
    const interceptor = new RequestLoggingInterceptor(
      { event: vi.fn() } as unknown as AppLogger,
      { recordHttpRequest: vi.fn() } as unknown as MetricsService,
    );
    const handle = vi.fn(() => of(null));
    interceptor.intercept({ getType: () => 'rpc' } as never, { handle });
    expect(handle).toHaveBeenCalledOnce();
  });
});
