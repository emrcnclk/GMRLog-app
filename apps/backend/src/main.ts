import 'reflect-metadata';

import { randomUUID } from 'node:crypto';

import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import * as Sentry from '@sentry/node';

import { AppModule } from './app.module';
import { ENV } from './infrastructure/config/config.module';
import type { BackendEnv } from './infrastructure/config/env.schema';
import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import { AppLogger } from './infrastructure/logging/app-logger.service';
import { setupSwagger } from './infrastructure/openapi/setup-swagger';
import { RealtimeIoAdapter } from './infrastructure/realtime/realtime-io.adapter';

loadBackendDotenv();

/**
 * Bootstrap order mirrors the F6.3 §5.2 platform shell:
 * env → logging → security middleware → CORS → prefix → realtime adapter →
 * docs → shutdown hooks → listen.
 */
async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    trustProxy: true,
    requestIdHeader: 'x-gmrlog-request-id',
    genReqId: () => randomUUID(),
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const env = app.get<BackendEnv>(ENV);

  if (env.SENTRY_DSN.trim().length > 0) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.APP_ENV,
    });
  }

  await app.register(
    helmet,
    env.NODE_ENV === 'production'
      ? {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          },
          hsts: {
            maxAge: 31_536_000,
            includeSubDomains: true,
            preload: false,
          },
        }
      : { contentSecurityPolicy: false, hsts: false },
  );
  await app.register(compress);

  // @fastify/cors defaults to GET,HEAD,POST only, which breaks browser preflight for
  // PATCH/PUT/DELETE endpoints, so the allowed methods are declared explicitly.
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['x-gmrlog-request-id'],
  });
  app.setGlobalPrefix(env.API_GLOBAL_PREFIX);
  app.useWebSocketAdapter(new RealtimeIoAdapter(app, env.CORS_ORIGINS));

  // Echo the correlation id on every response (S1 §10).
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, reply, done) => {
      void reply.header('x-gmrlog-request-id', request.id);
      done();
    });

  if (env.API_DOCS_ENABLED) {
    setupSwagger(app);
  }

  app.enableShutdownHooks();

  await app.listen(env.API_PORT, env.API_HOST);
  logger.log(
    `GMRLOG backend listening on http://${env.API_HOST}:${String(env.API_PORT)}/${env.API_GLOBAL_PREFIX}`,
    'Bootstrap',
  );
}

void bootstrap();
