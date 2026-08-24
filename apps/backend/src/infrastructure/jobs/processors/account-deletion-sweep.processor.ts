import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AccountDeletionService } from '../../../legal/account-deletion.service';
import { JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP } from '../job-names';
import type { JobPayload } from '../job-payload';

/**
 * Runs the erasure 12.6 promised for accounts that never come back.
 *
 * `AccountDeletionService.enforceGracePeriod` covers the player who returns;
 * this covers the one who does not, which was the gap left as a TODO.
 */
@Injectable()
export class AccountDeletionSweepProcessor {
  constructor(private readonly deletions: AccountDeletionService) {}

  supports(jobName: string): boolean {
    return jobName === JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP;
  }

  async process(job: Job<JobPayload>): Promise<void> {
    void job;
    await this.deletions.runExpiredDeletionSweep();
  }
}
