import {
  PrismaNotificationRepository,
  PrismaSessionRepository,
  type NotificationRepository,
  type SessionRepository,
} from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { AppLogger } from '../logging/app-logger.service';

/**
 * Domain cleanup helper for worker processors (D3.19). No in-process timers.
 */
@Injectable()
export class MaintenanceService {
  private readonly sessions: SessionRepository;
  private readonly notifications: NotificationRepository;

  constructor(
    prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {
    this.sessions = new PrismaSessionRepository(prisma);
    this.notifications = new PrismaNotificationRepository(prisma);
  }

  async runSessionCleanup(): Promise<void> {
    const now = new Date();

    try {
      const revokedSessions = await this.sessions.revokeExpiredBefore(now);
      const deletedSessions = await this.sessions.deleteRevokedOrExpiredBefore(now);

      this.logger.event(
        'info',
        { revokedSessions, deletedSessions },
        'maintenance.session.cleanup.completed',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event('error', { error: message }, 'maintenance.session.cleanup.failed');
      throw error;
    }
  }
}
