import { activityQuerySchema, feedQuerySchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §5 + §6.2 — list query for `/activity`. */
export class ActivityQueryDto extends createZodDto(activityQuerySchema) {}

/** D3.24 — Home feed query with filters. */
export class FeedQueryDto extends createZodDto(feedQuerySchema) {}
