import { achievementIdParamSchema, followSubjectUserIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class AchievementIdParamDto extends createZodDto(achievementIdParamSchema) {}

export class AchievementSubjectUserIdParamDto extends createZodDto(
  followSubjectUserIdParamSchema,
) {}
