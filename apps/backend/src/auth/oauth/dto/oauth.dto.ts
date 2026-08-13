import { oauthCallbackSchema, oauthStartSchema } from '@gmrlog/validators';

import { createZodDto } from '../../../infrastructure/http/zod-validation.pipe';

/** D4.3 / OAUTH.md §2 step 1. */
export class OAuthStartDto extends createZodDto(oauthStartSchema) {}

/** D4.3 / OAUTH.md §2 step 3. */
export class OAuthCallbackDto extends createZodDto(oauthCallbackSchema) {}
