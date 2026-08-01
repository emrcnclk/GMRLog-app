import {
  followCreateSchema,
  followSubjectUserIdParamSchema,
  followUserIdParamSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.20 FollowCreateRequest. */
export class FollowCreateDto extends createZodDto(followCreateSchema) {}

/** Path param for `DELETE /follows/{userId}`. */
export class FollowUserIdParamDto extends createZodDto(followUserIdParamSchema) {}

/** Path `{id}` for `/users/{id}/followers|following`. */
export class FollowSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}
