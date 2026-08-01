import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { SearchIndexService } from '../../search/search-index.service';
import { JOB_SEARCH_INDEX_DELETE, JOB_SEARCH_INDEX_UPSERT } from '../job-names';
import type { JobPayload } from '../job-payload';
import type { SearchIndexJobData } from '../search-index.publisher';

@Injectable()
export class SearchIndexProcessor {
  constructor(private readonly searchIndex: SearchIndexService) {}

  supports(jobName: string): boolean {
    return jobName === JOB_SEARCH_INDEX_UPSERT || jobName === JOB_SEARCH_INDEX_DELETE;
  }

  async process(job: Job<JobPayload<SearchIndexJobData>>): Promise<void> {
    const { action, type, id } = job.data.data;
    if (action === 'upsert') {
      await this.searchIndex.upsert(type, id);
      return;
    }
    await this.searchIndex.delete(type, id);
  }
}
