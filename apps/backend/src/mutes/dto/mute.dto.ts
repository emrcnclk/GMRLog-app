import { muteCreateSchema, muteUserIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class MuteCreateDto extends createZodDto(muteCreateSchema) {}
export class MuteUserIdParamDto extends createZodDto(muteUserIdParamSchema) {}
