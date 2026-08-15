import {
  followSubjectUserIdParamSchema,
  profilePinDeleteSchema,
  profilePinUpsertSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class ProfilePinUpsertDto extends createZodDto(profilePinUpsertSchema) {}

export class ProfilePinDeleteDto extends createZodDto(profilePinDeleteSchema) {}

/** 9.5d — `:id` param for `GET /users/{id}/pins`, same shape every other
 *  subject-user-id route in this app already validates against. */
export class ProfilePinSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}
