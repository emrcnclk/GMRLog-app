import type { AchievementDefinitionWrite } from '@gmrlog/database';
import type { AchievementCategoryValue } from '@gmrlog/types';

export interface AchievementSeedDefinition extends AchievementDefinitionWrite {
  category: AchievementCategoryValue;
}

/**
 * Seeded GMRLOG-owned achievement catalog (D3.21 / ACHIEVEMENT_SYSTEM.md).
 * `criteriaRef` maps to PlayerMetricSnapshot fields resolved in AchievementsService.
 */
export const ACHIEVEMENT_SEED_DEFINITIONS: readonly AchievementSeedDefinition[] = [
  // logging
  {
    key: 'logging.first_game',
    title: 'First Log',
    description: 'Add your first game to the library.',
    criteriaRef: 'library.total',
    category: 'logging',
    target: 1,
  },
  {
    key: 'logging.ten_games',
    title: 'Shelf Builder',
    description: 'Log 10 games in your library.',
    criteriaRef: 'library.total',
    category: 'logging',
    target: 10,
  },
  {
    key: 'logging.fifty_games',
    title: 'Archive Keeper',
    description: 'Log 50 games in your library.',
    criteriaRef: 'library.total',
    category: 'logging',
    target: 50,
  },
  // reviewing
  {
    key: 'reviewing.first_review',
    title: 'First Take',
    description: 'Publish your first review.',
    criteriaRef: 'reviews.count',
    category: 'reviewing',
    target: 1,
  },
  {
    key: 'reviewing.ten_reviews',
    title: 'Critic',
    description: 'Publish 10 reviews.',
    criteriaRef: 'reviews.count',
    category: 'reviewing',
    target: 10,
  },
  {
    key: 'reviewing.fifty_reviews',
    title: 'Essayist',
    description: 'Publish 50 reviews.',
    criteriaRef: 'reviews.count',
    category: 'reviewing',
    target: 50,
  },
  // friends
  {
    key: 'friends.first_friend',
    title: 'First Friend',
    description: 'Accept or form your first friendship.',
    criteriaRef: 'friends.count',
    category: 'friends',
    target: 1,
  },
  {
    key: 'friends.five_friends',
    title: 'Party of Five',
    description: 'Have 5 friends on GMRLOG.',
    criteriaRef: 'friends.count',
    category: 'friends',
    target: 5,
  },
  {
    key: 'friends.twenty_friends',
    title: 'Squad',
    description: 'Have 20 friends on GMRLOG.',
    criteriaRef: 'friends.count',
    category: 'friends',
    target: 20,
  },
  // collections
  {
    key: 'collections.first_collection',
    title: 'Curator Start',
    description: 'Create your first collection.',
    criteriaRef: 'collections.count',
    category: 'collections',
    target: 1,
  },
  {
    key: 'collections.five_collections',
    title: 'Curator',
    description: 'Create 5 collections.',
    criteriaRef: 'collections.count',
    category: 'collections',
    target: 5,
  },
  {
    key: 'collections.ten_collections',
    title: 'Archivist',
    description: 'Create 10 collections.',
    criteriaRef: 'collections.count',
    category: 'collections',
    target: 10,
  },
  // tier_lists
  {
    key: 'tier_lists.first_tier_list',
    title: 'Rank Beginner',
    description: 'Create your first tier list.',
    criteriaRef: 'tier_lists.count',
    category: 'tier_lists',
    target: 1,
  },
  {
    key: 'tier_lists.five_tier_lists',
    title: 'Rank Scholar',
    description: 'Create 5 tier lists.',
    criteriaRef: 'tier_lists.count',
    category: 'tier_lists',
    target: 5,
  },
  {
    key: 'tier_lists.ten_tier_lists',
    title: 'Tier Architect',
    description: 'Create 10 tier lists.',
    criteriaRef: 'tier_lists.count',
    category: 'tier_lists',
    target: 10,
  },
  // communities
  {
    key: 'communities.first_join',
    title: 'Community Welcome',
    description: 'Join your first community.',
    criteriaRef: 'communities.count',
    category: 'communities',
    target: 1,
  },
  {
    key: 'communities.five_communities',
    title: 'Community Regular',
    description: 'Join 5 communities.',
    criteriaRef: 'communities.count',
    category: 'communities',
    target: 5,
  },
  {
    key: 'communities.ten_communities',
    title: 'Community Citizen',
    description: 'Join 10 communities.',
    criteriaRef: 'communities.count',
    category: 'communities',
    target: 10,
  },
  // playtime
  {
    key: 'playtime.first_session',
    title: 'Session One',
    description: 'Log your first play session.',
    criteriaRef: 'sessions.count',
    category: 'playtime',
    target: 1,
  },
  {
    key: 'playtime.ten_sessions',
    title: 'Warm-up',
    description: 'Log 10 play sessions.',
    criteriaRef: 'sessions.count',
    category: 'playtime',
    target: 10,
  },
  {
    key: 'playtime.hundred_sessions',
    title: 'Hours Stacked',
    description: 'Log 100 play sessions.',
    criteriaRef: 'sessions.count',
    category: 'playtime',
    target: 100,
  },
  // consistency
  {
    key: 'consistency.three_active_days',
    title: 'Three-Day Rhythm',
    description: 'Be active on 3 distinct days.',
    criteriaRef: 'consistency.active_days',
    category: 'consistency',
    target: 3,
  },
  {
    key: 'consistency.seven_active_days',
    title: 'Weekly Rhythm',
    description: 'Be active on 7 distinct days.',
    criteriaRef: 'consistency.active_days',
    category: 'consistency',
    target: 7,
  },
  {
    key: 'consistency.thirty_active_days',
    title: 'Habitual',
    description: 'Be active on 30 distinct days.',
    criteriaRef: 'consistency.active_days',
    category: 'consistency',
    target: 30,
  },
  // milestones
  {
    key: 'milestones.profile_complete',
    title: 'Identity Settled',
    description: 'Complete avatar, banner, and bio on your profile.',
    criteriaRef: 'profile.complete',
    category: 'milestones',
    target: 1,
  },
  {
    key: 'milestones.ten_completed',
    title: 'Finisher',
    description: 'Mark 10 games as completed.',
    criteriaRef: 'library.completed',
    category: 'milestones',
    target: 10,
  },
  {
    key: 'milestones.hundred_library',
    title: 'Century Shelf',
    description: 'Reach 100 games in your library.',
    criteriaRef: 'library.total',
    category: 'milestones',
    target: 100,
  },
  // rare
  {
    key: 'rare.completion_legend',
    title: 'Completion Legend',
    description: 'Complete 50 games.',
    criteriaRef: 'library.completed',
    category: 'rare',
    isRare: true,
    target: 50,
  },
  // hidden
  {
    key: 'hidden.secret_dropper',
    title: 'Soft Quit Club',
    description: 'Drop 10 games from your library.',
    criteriaRef: 'library.dropped',
    category: 'hidden',
    isHidden: true,
    target: 10,
  },
];
