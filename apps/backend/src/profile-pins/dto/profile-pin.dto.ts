import { profilePinDeleteSchema, profilePinUpsertSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class ProfilePinUpsertDto extends createZodDto(profilePinUpsertSchema) {}

export class ProfilePinDeleteDto extends createZodDto(profilePinDeleteSchema) {}
