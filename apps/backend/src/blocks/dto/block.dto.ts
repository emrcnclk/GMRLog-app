import {
  blockCreateSchema,
  blocksListQuerySchema,
  blockUserIdParamSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.18 BlockCreateRequest. */
export class BlockCreateDto extends createZodDto(blockCreateSchema) {}

/** Path param for `DELETE /blocks/{userId}`. */
export class BlockUserIdParamDto extends createZodDto(blockUserIdParamSchema) {}

/** 3b.3a — `GET /blocks` query, cursor + limit. */
export class BlocksListQueryDto extends createZodDto(blocksListQuerySchema) {}
