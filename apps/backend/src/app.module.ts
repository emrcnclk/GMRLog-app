import { Module } from '@nestjs/common';

import { AchievementsModule } from './achievements/achievements.module';
import { ActivityModule } from './activity/activity.module';
import { ArchetypesModule } from './archetypes/archetypes.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { CollectionsModule } from './collections/collections.module';
import { CommentsModule } from './comments/comments.module';
import { CommunitiesModule } from './communities/communities.module';
import { CreatorModule } from './creator/creator.module';
import { DiscoverModule } from './discover/discover.module';
import { EventsModule } from './events/events.module';
import { FollowsModule } from './follows/follows.module';
import { FriendsModule } from './friends/friends.module';
import { GameHubModule } from './game-hub/game-hub.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { AppConfigModule } from './infrastructure/config/config.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { HttpInfrastructureModule } from './infrastructure/http/http.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { RealtimeModule } from './infrastructure/realtime/realtime.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { LibraryModule } from './library/library.module';
import { MessagingModule } from './messaging/messaging.module';
import { ModerationModule } from './moderation/moderation.module';
import { MutesModule } from './mutes/mutes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { ProfileHeroModule } from './profile-hero/profile-hero.module';
import { ProfilePinsModule } from './profile-pins/profile-pins.module';
import { QuotesModule } from './quotes/quotes.module';
import { ReactionsModule } from './reactions/reactions.module';
import { ReputationModule } from './reputation/reputation.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { StatisticsModule } from './statistics/statistics.module';
import { TierListsModule } from './tierlists/tierlists.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

/**
 * Platform shell (F6.3 §5.2). Platform infrastructure first, then the mounted
 * business domains (D2+).
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    MetricsModule,
    HttpInfrastructureModule,
    PrismaModule,
    JobsModule,
    RealtimeModule,
    AuthModule,
    HealthModule,
    UsersModule,
    LibraryModule,
    ReviewsModule,
    CommentsModule,
    ReactionsModule,
    PostsModule,
    GamesModule,
    CollectionsModule,
    TierListsModule,
    NotificationsModule,
    FollowsModule,
    FriendsModule,
    BlocksModule,
    MutesModule,
    QuotesModule,
    AchievementsModule,
    ArchetypesModule,
    StatisticsModule,
    ProfilePinsModule,
    ProfileHeroModule,
    CommunitiesModule,
    CreatorModule,
    ReputationModule,
    MessagingModule,
    DiscoverModule,
    IntegrationsModule,
    SearchModule,
    ActivityModule,
    EventsModule,
    GameHubModule,
    UploadsModule,
    ModerationModule,
  ],
})
export class AppModule {}
