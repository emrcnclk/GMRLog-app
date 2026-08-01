import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { map, type Observable } from 'rxjs';

import { buildEnvelopeFromValue } from './envelope';

/**
 * Wraps every HTTP success payload in the S1 §4 envelope
 * (`data` + `meta.requestId`). PaginatedPayload adds cursor meta (§4.2 / §5).
 * 204 / empty responses pass through untouched.
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    return next
      .handle()
      .pipe(
        map((value: unknown) =>
          value === undefined ? value : buildEnvelopeFromValue(value, request.id),
        ),
      );
  }
}
