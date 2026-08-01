import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { JOB_MAINTENANCE_SESSION_CLEANUP } from '../job-names';
import type { JobPayload } from '../job-payload';
import { MaintenanceService } from '../maintenance.service';

@Injectable()
export class SessionCleanupProcessor {
  constructor(private readonly maintenance: MaintenanceService) {}

  supports(jobName: string): boolean {
    return jobName === JOB_MAINTENANCE_SESSION_CLEANUP;
  }

  async process(job: Job<JobPayload>): Promise<void> {
    void job;
    await this.maintenance.runSessionCleanup();
  }
}
