import { followSubjectUserIdParamSchema, profileThemePatchSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** D3.29 — `PATCH /me/profile-theme` body. */
export class ProfileThemePatchDto extends createZodDto(profileThemePatchSchema) {}

/** D3.29 — `GET /users/{id}/profile-theme` path param; reuses the generic
 *  subject-user-id schema already shared by archetypes/follows. */
export class ProfileThemeUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}
