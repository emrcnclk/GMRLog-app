import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import { AchievementsService } from './achievements.service';

/**
 * Upserts seeded achievement definitions on module boot so progress recalculation
 * never depends on a manual admin craft step (D3.21 non-goal: admin crafting UI).
 */
@Injectable()
export class AchievementsBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AchievementsBootstrapService.name);

  constructor(private readonly achievements: AchievementsService) {}

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.achievements.seedDefinitions();
      this.logger.log(`Seeded ${String(count)} achievement definitions`);
    } catch (error: unknown) {
      this.logger.warn(
        `Achievement seed deferred (database unavailable): ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }
}
