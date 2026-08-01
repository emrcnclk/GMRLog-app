import {
  gameIdParamSchema,
  reviewCreateSchema,
  reviewIdParamSchema,
  reviewPatchSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.7 ReviewCreateRequest. */
export class ReviewCreateDto extends createZodDto(reviewCreateSchema) {}

/** PATCH allowlist for `/reviews/{id}`. */
export class ReviewPatchDto extends createZodDto(reviewPatchSchema) {}

/** Path param for `/reviews/{id}`. */
export class ReviewIdParamDto extends createZodDto(reviewIdParamSchema) {}

/** Path param for `/games/{id}/reviews`. */
export class GameIdParamDto extends createZodDto(gameIdParamSchema) {}
