import {
  oauthCallbackSchema,
  oauthStartSchema,
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
