import { createHash } from 'node:crypto';

import {
  ConflictException,
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
import { from, of, switchMap, tap, type Observable } from 'rxjs';

import {
  isAuthenticatedIdentity,
  REQUEST_IDENTITY_KEY,
  type IdentityCarrier,
} from '../../auth/interfaces/identity';
import { PLATFORM_REDIS } from '../redis/redis.constants';

export const IDEMPOTENT_KEY = 'gmrlog:idempotent';

/** Marks a POST create handler as S1 §11 idempotency-capable. */
export const Idempotent = (): MethodDecorator => SetMetadata(IDEMPOTENT_KEY, true);

const IDEMPOTENCY_TTL_SECONDS = 86_400;
const IDEMPOTENCY_HEADER = 'idempotency-key';

interface StoredIdempotencyRecord {
  bodyHash: string;
  statusCode: number;
  payload: unknown;
}

/**
 * S1 §11 — Idempotency-Key replay for listed POST create intents.
 * Absent key → proceed. Same key + same body → replay. Same key + different body → IDEMPOTENCY_REPLAY.
 * Stores the controller payload (pre-envelope); EnvelopeInterceptor re-wraps on replay.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly memory = new Map<string, StoredIdempotencyRecord>();

  constructor(
    private readonly reflector: Reflector,
    @Inject(PLATFORM_REDIS) private readonly redis: Redis,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isIdempotent) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & IdentityCarrier>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const rawKey = request.headers[IDEMPOTENCY_HEADER];
    const key = typeof rawKey === 'string' ? rawKey.trim() : '';
    if (key.length === 0) {
      return next.handle();
    }

    const bodyHash = hashBody(request.body);
    const storageKey = buildStorageKey(request, key);

    return from(this.load(storageKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          if (cached.bodyHash !== bodyHash) {
            throw new ConflictException({
              message: 'Idempotency-Key was reused with a different request body',
              code: 'IDEMPOTENCY_REPLAY',
            });
          }
          void reply.status(cached.statusCode);
          return of(cached.payload);
        }

        return next.handle().pipe(
          tap((payload) => {
            const statusCode = reply.statusCode >= 200 ? reply.statusCode : 201;
            if (statusCode >= 200 && statusCode < 300) {
              void this.save(storageKey, {
                bodyHash,
                statusCode,
                payload,
              });
            }
          }),
        );
      }),
    );
  }

  private async load(storageKey: string): Promise<StoredIdempotencyRecord | null> {
    try {
      if (this.redis.status === 'ready') {
        const raw = await this.redis.get(storageKey);
        if (raw) {
          return JSON.parse(raw) as StoredIdempotencyRecord;
        }
        return null;
      }
    } catch {
      // fall through to memory
    }
    return this.memory.get(storageKey) ?? null;
  }

  private async save(storageKey: string, record: StoredIdempotencyRecord): Promise<void> {
    this.memory.set(storageKey, record);
    try {
      if (this.redis.status === 'ready') {
        await this.redis.set(storageKey, JSON.stringify(record), 'EX', IDEMPOTENCY_TTL_SECONDS);
      }
    } catch {
      // memory already holds the record
    }
  }
}

function hashBody(body: unknown): string {
  const normalized = JSON.stringify(body ?? null);
  return createHash('sha256').update(normalized).digest('hex');
}

function buildStorageKey(
  request: FastifyRequest & IdentityCarrier,
  idempotencyKey: string,
): string {
  const identity = request[REQUEST_IDENTITY_KEY];
  const userId = identity && isAuthenticatedIdentity(identity) ? identity.userId : 'anonymous';
  const route = request.routeOptions.url ?? request.url;
  return `idempotency:${userId}:${request.method}:${route}:${idempotencyKey}`;
}
