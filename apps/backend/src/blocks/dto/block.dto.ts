import { blockCreateSchema, blockUserIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.18 BlockCreateRequest. */
export class BlockCreateDto extends createZodDto(blockCreateSchema) {}

/** Path param for `DELETE /blocks/{userId}`. */
export class BlockUserIdParamDto extends createZodDto(blockUserIdParamSchema) {}
