import {
  commentCreateSchema,
  commentHostIdParamSchema,
  commentIdParamSchema,
  commentPatchSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.8 CommentCreateRequest. */
export class CommentCreateDto extends createZodDto(commentCreateSchema) {}

/** D3.21 CommentPatchRequest — body only. */
export class CommentPatchDto extends createZodDto(commentPatchSchema) {}

/** Path param for `/comments/{id}`. */
export class CommentIdParamDto extends createZodDto(commentIdParamSchema) {}

/** Path `{id}` for host comment list routes. */
export class CommentHostIdParamDto extends createZodDto(commentHostIdParamSchema) {}
