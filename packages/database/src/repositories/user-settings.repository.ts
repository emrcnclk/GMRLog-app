import type {
  ConsoleGeneration,
  ContentVisibility,
  ProfileAccent,
  ProfileBannerStyle,
  ProfileCardStyle,
  ThemePreference,
  UserSettings,
} from '@prisma/client';

import type { DatabaseClient } from './types';

/** Persistence-shaped settings patch — every field optional, `null` clears. */
export interface UserSettingsUpsertData {
  locale?: string | null;
  theme?: ThemePreference | null;
  reduceMotion?: boolean;
  /** D3.29 — profile theme (docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md). */
  profileVisibility?: ContentVisibility;
  accent?: ProfileAccent;
  cardStyle?: ProfileCardStyle;
  bannerStyle?: ProfileBannerStyle;
  favoritePlatform?: string | null;
  consoleGeneration?: ConsoleGeneration | null;
  widgetOrder?: string[];
  pinnedWidgets?: string[];
  hiddenWidgets?: string[];
}

/**
 * UserSettings persistence (S2 §10.1). Persistence only — defaults, section
 * mapping and appearance/accessibility meaning live in the owning domain.
 */
export interface UserSettingsRepository {
  findByUser(userId: string): Promise<UserSettings | null>;
  upsertByUser(userId: string, data: UserSettingsUpsertData): Promise<UserSettings>;
}

export class PrismaUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly db: DatabaseClient) {}

  findByUser(userId: string): Promise<UserSettings | null> {
    return this.db.userSettings.findUnique({ where: { userId } });
  }

  upsertByUser(userId: string, data: UserSettingsUpsertData): Promise<UserSettings> {
    return this.db.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
