import type {
  AchievementResponse,
  LibraryEntryResponse,
  PlayerArchetypeResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import type { RarityTier } from '@gmrlog/ui';

import { achievementRarity } from './achievement-showcase-model';
import { resolveArchetypePair, type ResolvedArchetype } from './archetype-catalog';
import { archetypeLabel } from './profile-model';

/**
 * §6 — the player record card and the sections beneath it.
 *
 * Every selector here is a pure projection over what the API already returns.
 * Nothing derives a score, a rank or a holder share: those are server-owned, and
 * two devices must never disagree. Where §6 names a figure the wire types do not
 * carry, the selector returns fewer rows rather than inventing one — see the
 * per-function notes and the backend follow-ups recorded in TASKS.md.
 *
 * Covered by `player-record-model.spec.ts`.
 */

/**
 * Rank within the locked five-tier ramp, mirroring `RARITY_TIERS`' own order.
 *
 * Spelled as a total record over the union rather than read off the exported
 * array, because `@gmrlog/ui`'s value exports pull React Native into this
 * module and every other model file in this folder imports from it as a *type*
 * only, for exactly that reason. A new tier fails to compile here.
 */
const RARITY_RANK: Record<RarityTier, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function rarityRank(tier: RarityTier): number {
  return RARITY_RANK[tier];
}

// ---------------------------------------------------------------------------
// Archetype block
// ---------------------------------------------------------------------------

export interface RecordTrait {
  key: string;
  label: string;
  /** Pre-formatted; the pill never formats numbers itself. */
  value: string;
}

export const RECORD_TRAIT_LIMIT = 3;

/**
 * §6's trait pills — "each carrying a value in accent monospace
 * ('Completionist 94')". The value is the engine's own comparative score, shown
 * verbatim; the label is the short name from `ARCHETYPE_LABELS` rather than the
 * catalog's "The Completionist" title, which is what the doc's example spells.
 *
 * The primary archetype is excluded: the card already names it in full directly
 * above, and repeating it as a pill would spend a slot restating the headline.
 */
export function buildRecordTraits(
  archetypes: readonly PlayerArchetypeResponse[],
  limit = RECORD_TRAIT_LIMIT,
): RecordTrait[] {
  const pair = resolveArchetypePair(archetypes);
  const rest: ResolvedArchetype[] = [
    ...(pair.secondary === null ? [] : [pair.secondary]),
    ...pair.others,
  ];

  return rest.slice(0, limit).map((item) => ({
    key: item.profile.key,
    label: archetypeLabel(item.profile.key),
    value: String(Math.round(item.score)),
  }));
}

// ---------------------------------------------------------------------------
// Badge slots
// ---------------------------------------------------------------------------

export const RECORD_BADGE_SLOTS = 3;

export interface RecordBadge {
  achievement: AchievementResponse;
  rarity: RarityTier;
}

/**
 * The three equal-width badge slots. §6 does not say which badges are equipped
 * and no equip endpoint exists — `ProfilePinResponse` covers game, review and
 * collection only — so the card shows the player's strongest awarded badges by
 * rarity, ties broken on the most recent unlock and then on id for a stable
 * order between renders and between devices.
 *
 * **Backend follow-up (TASKS.md):** an equipped-badge slot on the profile DTO
 * would let the player choose these three, which is what the prototype's badge
 * picker does.
 */
export function selectRecordBadges(
  achievements: readonly AchievementResponse[],
  limit = RECORD_BADGE_SLOTS,
): RecordBadge[] {
  return achievements
    .filter((item) => item.progress.state === 'awarded')
    .map((achievement) => ({ achievement, rarity: achievementRarity(achievement) }))
    .sort(compareByRarityThenRecency)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Card stats
// ---------------------------------------------------------------------------

export interface RecordStat {
  key: string;
  label: string;
  value: string;
}

export const RECORD_STAT_SLOTS = 3;

/**
 * §6's "three card stats in a plain row". The doc does not name them; the
 * prototype's are Logged / Hours / Rank. Rank is dropped — it is a client-side
 * level derivation, and a figure on the record card is exactly where a
 * server-owned number belongs. The rest are read straight off
 * `UserStatisticsResponse`.
 *
 * Candidates are ordered, then the first three with real data win, so a brand
 * new account shows two honest figures rather than three with a dash in one.
 * Games logged sits last because the metric strip below the card already carries
 * it under "Games".
 */
export function buildRecordStats(
  statistics: UserStatisticsResponse | null,
  limit = RECORD_STAT_SLOTS,
): RecordStat[] {
  if (statistics === null) {
    return [];
  }

  const candidates: RecordStat[] = [];

  if (statistics.hoursPlayed > 0) {
    candidates.push({
      key: 'hours',
      label: 'Hours',
      value: `${String(Math.round(statistics.hoursPlayed))}h`,
    });
  }

  candidates.push({
    key: 'completion',
    label: 'Completion',
    value: `${String(Math.round(statistics.completionPercent))}%`,
  });

  if (statistics.reviewCount > 0) {
    candidates.push({
      key: 'reviews',
      label: 'Reviews',
      value: String(statistics.reviewCount),
    });
  }

  if (statistics.backlogSize > 0) {
    candidates.push({
      key: 'backlog',
      label: 'Backlog',
      value: String(statistics.backlogSize),
    });
  }

  candidates.push({
    key: 'logged',
    label: 'Logged',
    value: String(statistics.gamesLogged),
  });

  return candidates.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Sections below the card
// ---------------------------------------------------------------------------

export const RAREST_UNLOCK_LIMIT = 3;

/**
 * §6's "Rarest unlocks". Awarded badges only, strongest tier first — the same
 * ordering `selectRecordBadges` uses, so the card's slots and this section never
 * contradict each other about which badge is the player's best.
 */
export function selectRarestUnlocks(
  achievements: readonly AchievementResponse[],
  limit = RAREST_UNLOCK_LIMIT,
): AchievementResponse[] {
  return selectRecordBadges(achievements, limit).map((badge) => badge.achievement);
}

/**
 * §6's "Platinum case". GMRLOG has no platinum: no per-entry completion percent
 * exists anywhere in the schema, and `LibraryStatusValue` is a closed vocabulary
 * whose completion signal is the single flag `completed`. That flag *is* this
 * app's "finished it", so the case is built from it and named for what it is —
 * the trophy chip and the literal `100%` label the doc asks for are dropped
 * rather than faked.
 *
 * **Backend follow-up (TASKS.md):** a per-entry completion percent (or an
 * explicit platinum flag) would let the case say 100% and mean it.
 *
 * Most recently updated first — `updatedAt` is the only date the entry carries,
 * so it is also the "when" line each cover gets.
 */
export function selectCompletedCase(
  entries: readonly LibraryEntryResponse[],
  limit = 12,
): LibraryEntryResponse[] {
  return entries
    .filter((entry) => entry.status === 'completed')
    .sort(
      (a, b) =>
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.gameId.localeCompare(b.gameId),
    )
    .slice(0, limit);
}

/**
 * The record card's header line, right-aligned opposite "PLAYER RECORD".
 *
 * §6 puts a serial number there (`№ 0042`). Nothing on the wire carries one —
 * `UserSelfResponse` has a uuid and a created-at, and minting an ordinal from a
 * uuid on the client would be an identity claim two clients could disagree
 * about. The slot takes the real tenure fact instead, in the same monospace.
 *
 * **Backend follow-up (TASKS.md):** an additive `cardNumber` on the profile DTO
 * would let the card carry the serial §6 actually asks for.
 */
export function formatRecordSince(iso: string | null | undefined): string | null {
  if (iso == null) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

function compareByRarityThenRecency(a: RecordBadge, b: RecordBadge): number {
  const byRarity = rarityRank(b.rarity) - rarityRank(a.rarity);
  if (byRarity !== 0) {
    return byRarity;
  }
  const byDate =
    Date.parse(b.achievement.awardedAt ?? '') - Date.parse(a.achievement.awardedAt ?? '');
  if (!Number.isNaN(byDate) && byDate !== 0) {
    return byDate;
  }
  return a.achievement.id.localeCompare(b.achievement.id);
}
