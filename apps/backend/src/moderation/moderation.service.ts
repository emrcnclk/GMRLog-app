import type {
  CommentRepository,
  CommunityRepository,
  EventRepository,
  MessageRepository,
  ModerationCaseRepository,
  ObjectType,
  PostRepository,
  ReportRepository,
  ReportTargetType,
  ReviewRepository,
  UserRepository,
} from '@gmrlog/database';
import type { ReportResponse } from '@gmrlog/types';
import type { ReportCreateInput } from '@gmrlog/validators';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { toReportResponse } from './mappers/moderation.mapper';
import {
  MODERATION_CASE_REPOSITORY,
  MODERATION_COMMENT_REPOSITORY,
  MODERATION_COMMUNITY_REPOSITORY,
  MODERATION_EVENT_REPOSITORY,
  MODERATION_MESSAGE_REPOSITORY,
  MODERATION_POST_REPOSITORY,
  MODERATION_REVIEW_REPOSITORY,
  MODERATION_USER_REPOSITORY,
  REPORT_REPOSITORY,
} from './moderation.tokens';

/**
 * Moderation domain service (F6.3 / D2.19). Player report create only.
 * No AI · auto-bans · spam ML · websocket · notifications · staff queue HTTP.
 */
@Injectable()
export class ModerationService {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(MODERATION_CASE_REPOSITORY) private readonly cases: ModerationCaseRepository,
    @Inject(MODERATION_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MODERATION_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(MODERATION_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(MODERATION_COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(MODERATION_COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(MODERATION_EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(MODERATION_MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
  ) {}

  async createReport(reporterId: string, input: ReportCreateInput): Promise<ReportResponse> {
    await this.requireActiveUser(reporterId);
    // S1 §14.17 `details` — accepted; S2 Report has no details column (not persisted).
    void input.details;

    if (input.targetType === 'user' && input.targetId === reporterId) {
      throw new ForbiddenException('Cannot report yourself');
    }

    await this.requireTargetExists(input.targetType, input.targetId);

    const duplicate = await this.reports.findOpenByReporterAndTarget(
      reporterId,
      input.targetType,
      input.targetId,
    );
    if (duplicate) {
      throw new ConflictException('An open report already exists for this target');
    }

    const report = await this.reports.create({
      reporter: { connect: { id: reporterId } },
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      status: 'open',
    });

    const subjectType = toObjectType(input.targetType);
    if (subjectType !== null) {
      await this.cases.create({
        report: { connect: { id: report.id } },
        subjectType,
        subjectId: input.targetId,
        status: 'open',
      });
    }

    return toReportResponse(report);
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }

  private async requireTargetExists(targetType: ReportTargetType, targetId: string): Promise<void> {
    const exists = await this.targetExists(targetType, targetId);
    if (!exists) {
      throw new NotFoundException('Report target not found');
    }
  }

  private async targetExists(targetType: ReportTargetType, targetId: string): Promise<boolean> {
    switch (targetType) {
      case 'user': {
        const user = await this.users.findById(targetId);
        return user != null && user.deletedAt == null;
      }
      case 'post': {
        const post = await this.posts.findActiveById(targetId);
        return post != null;
      }
      case 'review': {
        const review = await this.reviews.findActiveById(targetId);
        return review != null;
      }
      case 'comment': {
        const comment = await this.comments.findActiveById(targetId);
        return comment != null;
      }
      case 'community': {
        const community = await this.communities.findActiveById(targetId);
        return community != null;
      }
      case 'event': {
        const event = await this.events.findActiveById(targetId);
        return event != null;
      }
      case 'message': {
        const message = await this.messages.findActiveById(targetId);
        return message != null;
      }
      default:
        return false;
    }
  }
}

/**
 * ReportTargetType → ObjectType for ModerationCase.
 * `message` is a valid report target but not an ObjectType member — case deferred.
 */
function toObjectType(targetType: ReportTargetType): ObjectType | null {
  switch (targetType) {
    case 'user':
    case 'post':
    case 'review':
    case 'comment':
    case 'community':
    case 'event':
      return targetType;
    case 'message':
      return null;
    default:
      return null;
  }
}
