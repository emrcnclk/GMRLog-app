export type { DatabaseClient } from './types';

export { PrismaUserRepository, type UserRepository } from './user.repository';
export {
  PrismaUserSettingsRepository,
  type UserSettingsRepository,
  type UserSettingsUpsertData,
} from './user-settings.repository';
export { PrismaSessionRepository, type SessionRepository } from './session.repository';
export {
  PrismaAuthCredentialRepository,
  type AuthCredentialRepository,
} from './auth-credential.repository';
export {
  PrismaBlockRepository,
  type BlockListCursor,
  type BlockListParams,
  type BlockRepository,
} from './block.repository';
export { PrismaMuteRepository, type MuteRepository } from './mute.repository';
export {
  PrismaPostBookmarkRepository,
  type PostBookmarkRepository,
  type PostBookmarkListCursor,
  type PostBookmarkListParams,
} from './post-bookmark.repository';
export { PrismaRepostRepository, type RepostRepository } from './repost.repository';
export {
  PrismaQuoteRepository,
  type QuoteRepository,
  type QuoteListCursor,
  type QuoteListParams,
} from './quote.repository';
export {
  PrismaPollRepository,
  PrismaPollVoteRepository,
  type PollRepository,
  type PollVoteRepository,
} from './poll.repository';
export {
  PrismaCommunityWikiRepository,
  type CommunityWikiRepository,
} from './community-wiki.repository';
export {
  PrismaCommunityPinRepository,
  type CommunityPinRepository,
} from './community-pin.repository';
export {
  PrismaCommunityMemberBadgeRepository,
  type CommunityMemberBadgeRepository,
} from './community-member-badge.repository';
export {
  PrismaUserReputationRepository,
  type UserReputationRepository,
} from './user-reputation.repository';
export { PrismaEventInviteRepository, type EventInviteRepository } from './event-invite.repository';
export {
  PrismaConnectedAccountRepository,
  type ConnectedAccountRepository,
} from './connected-account.repository';
export {
  PrismaGameRepository,
  type GameDetailRecord,
  type GameRepository,
} from './game.repository';
export {
  PrismaGameMetadataRepository,
  type ApplyGameMetadataInput,
  type BackfillCandidate,
  type CatalogCoverage,
  type CompanyRefInput,
  type GameCatalogMetadataRecord,
  type GameMetadataRepository,
  type GameMetadataScalars,
  type ImageVariantKeys,
  type NamedRefInput,
  type RecordMetadataRunInput,
  type RelatedGameInput,
  type TagRefInput,
  type UpsertGameMediaInput,
} from './game-metadata.repository';
export {
  PrismaLibraryEntryRepository,
  type LibraryEntryListFilter,
  type LibraryEntryRepository,
} from './library-entry.repository';
export { PrismaGameLogRepository, type GameLogRepository } from './game-log.repository';
export { PrismaReviewRepository, type ReviewRepository } from './review.repository';
export { PrismaPostRepository, type PostRepository } from './post.repository';
export { PrismaCommentRepository, type CommentRepository } from './comment.repository';
export { PrismaReactionRepository, type ReactionRepository } from './reaction.repository';
export { PrismaFollowRepository, type FollowRepository } from './follow.repository';
export {
  PrismaFriendshipRepository,
  friendshipPairIds,
  type FriendRequestListParams,
  type FriendshipRepository,
} from './friendship.repository';
export { PrismaPresenceRepository, type PresenceRepository } from './presence.repository';
export {
  PrismaUserArchetypeRepository,
  PrismaProfilePinRepository,
  type ProfilePinRepository,
  type UserArchetypeRepository,
} from './profile-social.repository';
export {
  PrismaAchievementRepository,
  type AchievementDefinitionWrite,
  type AchievementRepository,
} from './achievement.repository';
export {
  PrismaPlayerMetricsRepository,
  type PlayerDatedRow,
  type PlayerMetricSnapshot,
  type PlayerMetricsRepository,
  type PlayerReviewMetric,
} from './player-metrics.repository';
export { PrismaCollectionRepository, type CollectionRepository } from './collection.repository';
export {
  PrismaCollectionEntryRepository,
  type CollectionEntryRepository,
  type CollectionEntryWrite,
} from './collection-entry.repository';
export { PrismaTierListRepository, type TierListRepository } from './tier-list.repository';
export {
  PrismaTierSlotRepository,
  type TierSlotBoardRow,
  type TierSlotRepository,
  type TierSlotWrite,
  type TierSlotGameWrite,
} from './tier-slot.repository';
export {
  PrismaNotificationRepository,
  type NotificationListCursor,
  type NotificationListParams,
  type NotificationRepository,
} from './notification.repository';
export {
  PrismaCommunityRepository,
  type CommunityListCursor,
  type CommunityListOptions,
  type CommunityRepository,
} from './community.repository';
export {
  PrismaCommunityMemberRepository,
  type CommunityMemberRepository,
} from './community-member.repository';
export {
  PrismaEventRepository,
  type EventListCursor,
  type EventListParams,
  type EventRepository,
} from './event.repository';
export {
  PrismaEventParticipationRepository,
  type EventParticipationRepository,
} from './event-participation.repository';
export {
  PrismaConversationRepository,
  type ConversationRepository,
} from './conversation.repository';
export {
  PrismaConversationParticipantRepository,
  type ConversationParticipantRepository,
} from './conversation-participant.repository';
export {
  PrismaMessageRepository,
  type MessageListCursor,
  type MessageListParams,
  type MessageRepository,
} from './message.repository';
export {
  PrismaDiscoverRepository,
  type DiscoverListCursor,
  type DiscoverListParams,
  type DiscoverRepository,
} from './discover.repository';
export {
  enrichDiscoverGames,
  listDiscoverGamesByIds,
  type DiscoverGameRecord,
  type DiscoverGamesListCursor,
  type DiscoverGamesListParams,
  type DiscoverGamesSort,
} from './discover-games.repository';
export {
  PrismaActivityRepository,
  type ActivityFeedRow,
  type ActivityListCursor,
  type ActivityListParams,
  type ActivityRepository,
  type HomeFeedRow,
} from './activity.repository';
export {
  PrismaCommunityActivityRepository,
  type CommunityActivityFeedRow,
  type CommunityActivityListParams,
  type CommunityActivityRepository,
} from './community-activity.repository';
export {
  PrismaSearchRepository,
  type SearchHitRecord,
  type SearchHitType,
  type SearchListCursor,
  type SearchListParams,
  type SearchRepository,
} from './search.repository';
export { PrismaUploadRepository, type UploadRepository } from './upload.repository';
export { PrismaReportRepository, type ReportRepository } from './report.repository';
export {
  PrismaModerationCaseRepository,
  type ModerationCaseRepository,
} from './moderation-case.repository';
export { PrismaAdminActionRepository, type AdminActionRepository } from './admin-action.repository';
export { PrismaUserConsentRepository, type UserConsentRepository } from './user-consent.repository';
