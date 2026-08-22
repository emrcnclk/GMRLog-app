import {
  HttpException,
  HttpStatus,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { tap, type Observable } from 'rxjs';

import { MetricsService } from '../metrics/metrics.service';

import { AppLogger } from './app-logger.service';

/**
 * Structured request logging: method · url · statusCode · durationMs · requestId · correlationId.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLogger,
    private readonly metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const startedAt = performance.now();
    const correlationId = resolveCorrelationId(request);
    // The route *pattern* (e.g. `/api/v1/users/:id`), not the raw URL — keeps
    // metric label cardinality bounded by route count rather than by every
    // distinct ID a client ever requests. Same fallback other interceptors in
    // this codebase use (idempotency.interceptor.ts, rate-limit.interceptor.ts):
    // `routeOptions.url` is null for a request that matched no route (a 404).
    const route = request.routeOptions.url ?? request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Math.round(performance.now() - startedAt);
          this.metrics.recordHttpRequest({
            method: request.method,
            route,
            statusCode: reply.statusCode,
            durationMs,
          });
          this.logger.event(
            'info',
            {
              requestId: request.id,
              correlationId,
              method: request.method,
              url: request.url,
              statusCode: reply.statusCode,
              durationMs,
            },
            'request completed',
          );
        },
        error: (error: unknown) => {
          const durationMs = Math.round(performance.now() - startedAt);
          const statusCode =
            error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
          this.metrics.recordHttpRequest({
            method: request.method,
            route,
            statusCode,
            durationMs,
          });
          this.logger.event(
            'warn',
            {
              requestId: request.id,
              correlationId,
              method: request.method,
              url: request.url,
              durationMs,
              error: error instanceof Error ? error.message : String(error),
            },
            'request failed',
          );
        },
      }),
    );
  }
}

function resolveCorrelationId(request: FastifyRequest): string {
  const header = request.headers['x-gmrlog-correlation-id'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }
  if (Array.isArray(header) && typeof header[0] === 'string' && header[0].trim().length > 0) {
    return header[0].trim();
  }
  return request.id;
}
