import type {
  ConnectedAccountRepository,
  Prisma,
  Upload,
  UploadRepository,
  User,
  UserRepository,
  UserSettingsRepository,
  UserSettingsUpsertData,
} from '@gmrlog/database';
import type {
  ConnectedAccountResponse,
  SettingsResponse,
  UserPublicResponse,
  UserSelfResponse,
} from '@gmrlog/types';
import type {
  MePatchInput,
  SettingsAccessibilityPatchInput,
  SettingsAppearancePatchInput,
} from '@gmrlog/validators';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  toConnectedAccountResponse,
  toSettingsResponse,
  toUserPublicResponse,
  toUserSelfResponse,
} from './mappers/user.mapper';
import {
  CONNECTED_ACCOUNT_REPOSITORY,
  UPLOAD_REPOSITORY,
  USER_REPOSITORY,
  USER_SETTINGS_REPOSITORY,
} from './users.tokens';

/**
 * User domain service (F6.3 — controllers → services → repositories).
 * Owns self-profile, settings sections and connected-account read state.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_SETTINGS_REPOSITORY) private readonly settings: UserSettingsRepository,
    @Inject(CONNECTED_ACCOUNT_REPOSITORY) private readonly accounts: ConnectedAccountRepository,
    @Inject(UPLOAD_REPOSITORY) private readonly uploads: UploadRepository,
  ) {}

  async getMe(userId: string): Promise<UserSelfResponse> {
    const user = await this.requireActiveUser(userId);
    const accounts = await this.accounts.listByUser(userId);
    return toUserSelfResponse(user, accounts);
  }

  async updateMe(userId: string, patch: MePatchInput): Promise<UserSelfResponse> {
    await this.requireActiveUser(userId);

    const data: Prisma.UserUpdateInput = {};
    if (patch.displayName !== undefined) {
      data.displayName = patch.displayName;
    }
    if (patch.bio !== undefined) {
      // S1 §14.5 — null clears.
      data.bio = patch.bio;
    }
    if (patch.avatarUploadId !== undefined) {
      const upload = await this.requireConfirmedMediaUpload(userId, patch.avatarUploadId, 'avatar');
      data.avatarKey = upload.storageKey;
    }
    if (patch.bannerUploadId !== undefined) {
      const upload = await this.requireConfirmedMediaUpload(userId, patch.bannerUploadId, 'banner');
      data.bannerKey = upload.storageKey;
    }

    if (Object.keys(data).length > 0) {
      await this.users.update(userId, data);
    }
    return this.getMe(userId);
  }

  async getSettings(userId: string): Promise<SettingsResponse> {
    await this.requireActiveUser(userId);
    return toSettingsResponse(await this.settings.findByUser(userId));
  }

  async updateAppearance(
    userId: string,
    patch: SettingsAppearancePatchInput,
  ): Promise<SettingsResponse> {
    await this.requireActiveUser(userId);
    const data: UserSettingsUpsertData = {};
    if (patch.theme !== undefined) data.theme = patch.theme;
    if (patch.locale !== undefined) data.locale = patch.locale;
    return toSettingsResponse(await this.settings.upsertByUser(userId, data));
  }

  async updateAccessibility(
    userId: string,
    patch: SettingsAccessibilityPatchInput,
  ): Promise<SettingsResponse> {
    await this.requireActiveUser(userId);
    const data: UserSettingsUpsertData = {};
    if (patch.reduceMotion !== undefined) data.reduceMotion = patch.reduceMotion;
    return toSettingsResponse(await this.settings.upsertByUser(userId, data));
  }

  async listConnectedAccounts(userId: string): Promise<ConnectedAccountResponse[]> {
    await this.requireActiveUser(userId);
    const accounts = await this.accounts.listByUser(userId);
    return accounts.map(toConnectedAccountResponse);
  }

  /** `GET /users/{id}` — public profile card, guest-readable. */
  async getPublicUser(userId: string): Promise<UserPublicResponse> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return toUserPublicResponse(user);
  }

  /**
   * A verified credential whose subject no longer exists (or is soft-deleted)
   * is a stale identity — fail closed as authn, never as an empty profile
   * (F6.7 fail-closed law).
   */
  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user?.deletedAt !== null) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }

  private async requireConfirmedMediaUpload(
    ownerId: string,
    uploadId: string,
    purpose: 'avatar' | 'banner',
  ): Promise<Upload> {
    const upload = await this.uploads.findByOwnerAndId(ownerId, uploadId);
    if (upload?.status !== 'confirmed' || upload.purpose !== purpose) {
      throw new BadRequestException('Referenced upload is not a confirmed upload');
    }
    return upload;
  }
}
