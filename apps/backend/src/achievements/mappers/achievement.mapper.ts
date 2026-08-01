import type { Achievement, AchievementProgress, AchievementState } from '@gmrlog/database';
import type { AchievementCategoryValue, AchievementResponse } from '@gmrlog/types';

const HIDDEN_LOCKED_TITLE = 'Hidden achievement';
const HIDDEN_LOCKED_DESCRIPTION = 'Keep playing to uncover this achievement.';

export function toAchievementResponse(
  definition: Achievement,
  progress: AchievementProgress | null,
  options: { redactHidden: boolean },
): AchievementResponse {
  const target = progress?.target ?? definition.target;
  const current = progress?.current ?? 0;
  const state: AchievementState = progress?.state ?? 'locked';
  const isHiddenLocked = definition.isHidden && state !== 'awarded';
  const shouldRedact = options.redactHidden && isHiddenLocked;

  return {
    id: definition.id,
    key: definition.key,
    title: shouldRedact ? HIDDEN_LOCKED_TITLE : definition.title,
    description: shouldRedact ? HIDDEN_LOCKED_DESCRIPTION : definition.description,
    category: definition.category as AchievementCategoryValue,
    isHidden: definition.isHidden,
    isRare: definition.isRare,
    progress: {
      current: shouldRedact ? 0 : current,
      target,
      state: shouldRedact ? 'locked' : state,
    },
    awardedAt: progress?.awardedAt?.toISOString() ?? null,
  };
}
