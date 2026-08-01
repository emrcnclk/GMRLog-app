import {
  bookmarkListQuerySchema,
  gameIdParamSchema,
  pollVoteSchema,
  postCreateSchema,
  postIdParamSchema,
  postPatchSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.6 PostCreateRequest. */
export class PostCreateDto extends createZodDto(postCreateSchema) {}

/** PATCH allowlist for `/posts/{id}`. */
export class PostPatchDto extends createZodDto(postPatchSchema) {}

/** Path param for `/posts/{id}`. */
export class PostIdParamDto extends createZodDto(postIdParamSchema) {}

/** Path param for `/games/{id}/posts`. */
export class GameIdParamDto extends createZodDto(gameIdParamSchema) {}

/** D3.24 Composer++ — `POST /posts/{id}/poll/vote` body. */
export class PollVoteDto extends createZodDto(pollVoteSchema) {}

/** D3.24 SOCIAL_ACTIONS — `GET /bookmarks` cursor + limit. */
export class BookmarkListQueryDto extends createZodDto(bookmarkListQuerySchema) {}
