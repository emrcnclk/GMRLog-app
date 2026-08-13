import {
  oauthCallbackSchema,
  oauthConnectCallbackSchema,
  oauthConnectStartSchema,
  oauthStartSchema,
  setPasswordSchema,
  steamConnectCallbackSchema,
  steamConnectStartSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../../infrastructure/http/zod-validation.pipe';

/** D4.3 / OAUTH.md §2 step 1. */
export class OAuthStartDto extends createZodDto(oauthStartSchema) {}

/** D4.3 / OAUTH.md §2 step 3. */
export class OAuthCallbackDto extends createZodDto(oauthCallbackSchema) {}

/** D4.5 — `POST /auth/connect/steam/start` body. */
export class SteamConnectStartDto extends createZodDto(steamConnectStartSchema) {}

/** D4.5 — `POST /auth/connect/steam/callback` body. */
export class SteamConnectCallbackDto extends createZodDto(steamConnectCallbackSchema) {}

/** D4.7 — `POST /auth/oauth/:provider/connect/start` body. */
export class OAuthConnectStartDto extends createZodDto(oauthConnectStartSchema) {}

/** D4.7 — `POST /auth/oauth/:provider/connect/callback` body. */
export class OAuthConnectCallbackDto extends createZodDto(oauthConnectCallbackSchema) {}

/** D4.7 — `POST /auth/password` body. */
export class SetPasswordDto extends createZodDto(setPasswordSchema) {}
