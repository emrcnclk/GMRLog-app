import { quoteCreateSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class QuoteCreateDto extends createZodDto(quoteCreateSchema) {}
