import { randomUUID } from 'node:crypto';

import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  SetMetadata,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Redis } from 'ioredis';
import { from, switchMap, type Observable } from 'rxjs';

import {
  isAuthenticatedIdentity,
  REQUEST_IDENTITY_KEY,
  type IdentityCarrier,
} from '../../auth/interfaces/identity';
import { AppLogger } from '../logging/app-logger.service';
import { PLATFORM_REDIS } from '../redis/redis.constants';

/** S1 §11 rate limit classes. */
export type RateLimitClassName =
  | 'auth'
  | 'write'
  | 'read'
  | 'search'
  | 'upload'
  | 'integration'
  | 'social'
  | 'message'
  | 'export'
  | 'deletion'
  | 'public';

export const RATE_LIMIT_CLASS_KEY = 'gmrlog:rate-limit-class';

/** Overrides the default class derived from HTTP method / path. */
export const RateLimitClass = (name: RateLimitClassName): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_CLASS_KEY, name);

interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

/** Production defaults (RATE_LIMITING.md subset · S1 class names). */
const CLASS_POLICIES: Readonly<Record<RateLimitClassName, RateLimitPolicy>> = {
  auth: { limit: 5, windowMs: 60_000 },
  write: { limit: 180, windowMs: 60_000 },
  read: { limit: 300, windowMs: 60_000 },
  search: { limit: 120, windowMs: 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  integration: { limit: 20, windowMs: 60_000 },
  social: { limit: 60, windowMs: 60_000 },
  message: { limit: 120, windowMs: 60_000 },
  // RATE_LIMITING.md "Export" — `POST /users/me/export` §12.5: 1 per 24h per
  // user. A GDPR/KVKK export fans out across every table a player owns; the
  // window is a day, not a minute, so this sits outside CLASS_POLICIES' other
  // per-minute buckets on purpose.
  export: { limit: 1, windowMs: 24 * 60 * 60 * 1000 },
  // 12.6 — `POST /me/account/deletion` §7's own text promises a human-handled
  // request gets a response "within 30 days"; a self-serve one costs nothing
  // to repeat, so it needs its own guard rather than inheriting `write`'s
  // 180/minute. 1 per day matches `export`'s reasoning: this is a rare,
  // deliberate action, not a hot path.
  deletion: { limit: 1, windowMs: 24 * 60 * 60 * 1000 },
  public: { limit: 60, windowMs: 60_000 },
};

interface WindowResult {
  limited: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter: number;
}

/**
 * Rate-limit interceptor — Redis sliding window (RATE_LIMITING.md).
 * Runs after auth guards so player scope is available.
 * Fail-open when Redis is unavailable (auth class fails closed with 503).
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PLATFORM_REDIS) private readonly redis: Redis,
    private readonly logger: AppLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    // Unit controller suites share `user-1` against a live Redis window; skip unless
    // the rate-limit interceptor's own specs opt back in via GMRLOG_RATE_LIMIT_IN_TESTS.
    if (process.env.VITEST === 'true' && process.env.GMRLOG_RATE_LIMIT_IN_TESTS !== '1') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & IdentityCarrier>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const path = request.routeOptions.url ?? request.url;
    if (path.includes('/health') || path.includes('/metrics')) {
      return next.handle();
    }

    const rateClass = this.resolveClass(context, request);
    const policy = CLASS_POLICIES[rateClass];
    const identifier = this.resolveIdentifier(request);

    return from(this.tryConsume(rateClass, identifier, policy)).pipe(
      switchMap((result) => {
        if (result !== null) {
          void reply.header('x-ratelimit-limit', String(result.limit));
          void reply.header('x-ratelimit-remaining', String(result.remaining));
          void reply.header('x-ratelimit-reset', String(result.resetAt));
          if (result.limited) {
            throw new HttpException(
              {
                message: 'Rate limit exceeded',
                code: 'RATE_LIMITED',
                retryAfter: result.retryAfter,
              },
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        }
        return next.handle();
      }),
    );
  }

  private async tryConsume(
    rateClass: RateLimitClassName,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<WindowResult | null> {
    try {
      return await this.consume(`ratelimit:${rateClass}:${identifier}`, policy);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event('warn', { error: message, rateClass }, 'RATE_LIMIT_REDIS_UNAVAILABLE');
      if (rateClass === 'auth') {
        throw new HttpException(
          {
            message: 'Rate limit service unavailable',
            code: 'INTEGRATION_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      return null;
    }
  }

  private resolveClass(context: ExecutionContext, request: FastifyRequest): RateLimitClassName {
    const explicit = this.reflector.getAllAndOverride<RateLimitClassName | undefined>(
      RATE_LIMIT_CLASS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (explicit !== undefined) {
      return explicit;
    }

    const path = request.routeOptions.url ?? request.url;
    if (path.includes('/search')) return 'search';
    if (path.includes('/uploads')) return 'upload';
    if (path.includes('/follows') || path.includes('/reactions') || path.includes('/reports')) {
      return 'social';
    }
    if (path.includes('/messages')) return 'message';
    if (path.includes('/sessions') || path.includes('/auth')) return 'auth';

    const method = request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD') return 'read';
    return 'write';
  }

  private resolveIdentifier(request: FastifyRequest & IdentityCarrier): string {
    const identity = request[REQUEST_IDENTITY_KEY];
    if (identity !== undefined && isAuthenticatedIdentity(identity)) {
      return `user:${identity.userId}`;
    }
    const forwarded = request.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : request.ip;
    return `ip:${ip && ip.length > 0 ? ip : 'unknown'}`;
  }

  private async consume(key: string, policy: RateLimitPolicy): Promise<WindowResult> {
    if (this.redis.status !== 'ready') {
      throw new Error('redis not ready');
    }

    const now = Date.now();
    const windowStart = now - policy.windowMs;
    const member = `${String(now)}:${randomUUID()}`;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, member);
    pipeline.zcard(key);
    pipeline.pexpire(key, policy.windowMs);
    const results = await pipeline.exec();
    if (!results) {
      throw new Error('redis pipeline failed');
    }

    const countEntry = results[2];
    const count = typeof countEntry?.[1] === 'number' ? countEntry[1] : Number(countEntry?.[1]);
    const limited = count > policy.limit;
    if (limited) {
      await this.redis.zrem(key, member);
    }

    const remaining = Math.max(0, policy.limit - (limited ? count - 1 : count));
    const resetAt = Math.ceil((now + policy.windowMs) / 1000);
    const retryAfter = Math.max(1, Math.ceil(policy.windowMs / 1000));

    return {
      limited,
      remaining,
      limit: policy.limit,
      resetAt,
      retryAfter,
    };
  }
}
