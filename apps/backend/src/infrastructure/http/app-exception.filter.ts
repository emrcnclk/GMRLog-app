import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppLogger } from '../logging/app-logger.service';

import { buildApiError, zodErrorToFields } from './api-error';
import { ZodValidationException } from './zod-validation.pipe';

interface HttpExceptionBody {
  message?: string | string[];
  code?: string;
  retryAfter?: number;
}

/**
 * Global exception filter — every HTTP failure leaves through the S1 §7 error
 * envelope. No internal detail leaks on 5xx.
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const requestId = request.id;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected error';
    let code: string | undefined;
    let fields: ReturnType<typeof zodErrorToFields> | undefined;
    let retryAfter: number | undefined;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      fields = zodErrorToFields(exception.zodError);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const typed = body as HttpExceptionBody;
        message = Array.isArray(typed.message)
          ? typed.message.join('; ')
          : (typed.message ?? exception.message);
        code = typeof typed.code === 'string' ? typed.code : undefined;
        if (typeof typed.retryAfter === 'number' && Number.isFinite(typed.retryAfter)) {
          retryAfter = Math.max(1, Math.ceil(typed.retryAfter));
        }
      }
      if (status >= 500) {
        message = 'Unexpected error';
      }
    }

    const errorBody = buildApiError({ status, requestId, message, code, fields });

    this.logger.event(
      status >= 500 ? 'error' : 'warn',
      {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: status,
        code: errorBody.code,
        ...(exception instanceof Error && status >= 500 ? { stack: exception.stack } : {}),
      },
      'request errored',
    );

    // S1 §11 — Retry-After required on rate errors.
    if (status === 429 && retryAfter != null) {
      void reply.header('retry-after', String(retryAfter));
    }

    void reply.status(status).send({ error: errorBody });
  }
}
