import type { ProfilePinResponse } from '@gmrlog/types';

/**
 * 9.5e — the badge picker's pure model. `ACHIEVEMENT_PIN_LIMIT` mirrors the
 * backend's own constant (`profile-pins.service.ts`) so the picker can
 * communicate the cap before the fourth tap rather than after a rejected
 * request; the server remains the sole enforcer.
 */
export const ACHIEVEMENT_PIN_LIMIT = 3;

/** Equipped achievement ids, in the player's own stored `position` order. */
export function selectEquippedAchievementIds(pins: readonly ProfilePinResponse[]): string[] {
  return [...pins]
    .filter((pin) => pin.kind === 'achievement')
    .sort((a, b) => a.position - b.position)
    .map((pin) => pin.objectId);
}

/**
 * Move an equipped badge by one slot. Swap-based, same shape as
 * `profile-customization-model.ts`'s `moveWidget` — no drag gesture, since
 * 6.3 already proved RNW's transform-animation bridge is dead on web and a
 * reorder control that works on native and freezes on web isn't shippable.
 * Returns the input unchanged when the move would fall off either end.
 */
export function moveEquippedBadge(
  order: readonly string[],
  achievementId: string,
  direction: 'up' | 'down',
): string[] {
  const index = order.indexOf(achievementId);
  if (index === -1) {
    return [...order];
  }
  const target = direction === 'up' ? index - 1 : index + 1;

  const next = [...order];
  const moved = next[index];
  const displaced = next[target];
  if (moved === undefined || displaced === undefined) {
    return next;
  }

  next[index] = displaced;
  next[target] = moved;
  return next;
}
