import { searchQuerySchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §13.5 GET `/search` — `q` required · cursor + limit optional. */
export class SearchQueryDto extends createZodDto(searchQuerySchema) {}
