import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { RequestLoggingInterceptor } from '../logging/request-logging.interceptor';
import { MetricsModule } from '../metrics/metrics.module';
import { RedisModule } from '../redis/redis.module';

import { AppExceptionFilter } from './app-exception.filter';
import { EnvelopeInterceptor } from './envelope.interceptor';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { ZodValidationPipe } from './zod-validation.pipe';

/**
 * Registers the global HTTP cross-cutting concerns once (F6.3 §5.2 shell law).
 *
 * Interceptor bind order (request →): logging → rate-limit → envelope → idempotency → handler
 * so idempotency stores the pre-envelope controller payload and envelope re-wraps on replay.
 */
@Module({
  imports: [RedisModule, MetricsModule],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class HttpInfrastructureModule {}
