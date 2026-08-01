import { reactionCreateSchema, reactionIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.19 ReactionCreateRequest. */
export class ReactionCreateDto extends createZodDto(reactionCreateSchema) {}

/** Path param for `/reactions/{id}`. */
export class ReactionIdParamDto extends createZodDto(reactionIdParamSchema) {}
