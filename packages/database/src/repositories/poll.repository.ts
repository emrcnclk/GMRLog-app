import type { Poll, PollVote, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Poll persistence (D3.24 Composer++ · docs/07_SOCIAL/SOCIAL_POSTS_V2.md).
 * One poll per post (`postId` unique). Persistence only.
 */
export interface PollRepository {
  create(data: Prisma.PollCreateInput): Promise<Poll>;
  findById(id: string): Promise<Poll | null>;
  findByPostId(postId: string): Promise<Poll | null>;
  update(id: string, data: Prisma.PollUpdateInput): Promise<Poll>;
  delete(id: string): Promise<Poll>;
}

export class PrismaPollRepository implements PollRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.PollCreateInput): Promise<Poll> {
    return this.db.poll.create({ data });
  }

  findById(id: string): Promise<Poll | null> {
    return this.db.poll.findUnique({ where: { id } });
  }

  findByPostId(postId: string): Promise<Poll | null> {
    return this.db.poll.findUnique({ where: { postId } });
  }

  update(id: string, data: Prisma.PollUpdateInput): Promise<Poll> {
    return this.db.poll.update({ where: { id }, data });
  }

  delete(id: string): Promise<Poll> {
    return this.db.poll.delete({ where: { id } });
  }
}

/**
 * PollVote persistence — unique per (pollId, userId), one vote per user (§ Polls).
 */
export interface PollVoteRepository {
  create(data: Prisma.PollVoteCreateInput): Promise<PollVote>;
  findByPollAndUser(pollId: string, userId: string): Promise<PollVote | null>;
  listByPoll(pollId: string): Promise<PollVote[]>;
  /** Vote counts keyed by option index (dense — missing options default to 0 by caller). */
  countByOption(pollId: string): Promise<ReadonlyMap<number, number>>;
  delete(id: string): Promise<PollVote>;
}

export class PrismaPollVoteRepository implements PollVoteRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.PollVoteCreateInput): Promise<PollVote> {
    return this.db.pollVote.create({ data });
  }

  findByPollAndUser(pollId: string, userId: string): Promise<PollVote | null> {
    return this.db.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } });
  }

  listByPoll(pollId: string): Promise<PollVote[]> {
    return this.db.pollVote.findMany({ where: { pollId } });
  }

  async countByOption(pollId: string): Promise<ReadonlyMap<number, number>> {
    const rows = await this.db.pollVote.groupBy({
      by: ['optionIndex'],
      where: { pollId },
      _count: { _all: true },
    });
    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.optionIndex, row._count._all);
    }
    return counts;
  }

  delete(id: string): Promise<PollVote> {
    return this.db.pollVote.delete({ where: { id } });
  }
}
