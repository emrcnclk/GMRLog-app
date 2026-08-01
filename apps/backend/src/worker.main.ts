import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import { WorkerModule } from './infrastructure/jobs/worker.module';
import { AppLogger } from './infrastructure/logging/app-logger.service';

loadBackendDotenv();

/**
 * BullMQ worker bootstrap (D3.19). Separate process from REST API.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  logger.log('GMRLOG worker context ready', 'WorkerBootstrap');
}

void bootstrap();
