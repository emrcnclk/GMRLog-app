import {
  DISCOVER_LIST_MAX_LIMIT,
  becauseYouPlayedQuerySchema,
  discoverListQuerySchema,
  discoverGamesListQuerySchema,
  discoverTrendingQuerySchema,
  gameIdParamSchema,
} from '@gmrlog/validators';
import { z } from 'zod';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §5 — cursor + limit for discover product lists. */
export class DiscoverListQueryDto extends createZodDto(discoverListQuerySchema) {}

/** S1.2 §13.5 — cursor · limit · sort · catalog filters for discover games. */
export class DiscoverGamesListQueryDto extends createZodDto(discoverGamesListQuerySchema) {}

/** D3.22 — trending window · entity · pagination. */
export class DiscoverTrendingQueryDto extends createZodDto(discoverTrendingQuerySchema) {}

/** D3.22 — `:id` for similar-games / similar-users. */
export class DiscoverEntityIdParamDto extends createZodDto(gameIdParamSchema) {}

const discoverLimitQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

/** D3.22 — limit-only query for recommended / popular / hidden-gems / collections. */
export class DiscoverLimitQueryDto extends createZodDto(discoverLimitQuerySchema) {}

/** D3.24 — `GET /discover/because-you-played` query (BECAUSE_YOU_PLAYED.md). */
export class BecauseYouPlayedQueryDto extends createZodDto(becauseYouPlayedQuerySchema) {}
