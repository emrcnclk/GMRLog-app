import { legalDocumentParamSchema, legalLocaleQuerySchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** Path param for `GET /legal/{document}`. */
export class LegalDocumentParamDto extends createZodDto(legalDocumentParamSchema) {}

/** `?locale=` for both legal routes. Optional; the service falls back. */
export class LegalLocaleQueryDto extends createZodDto(legalLocaleQuerySchema) {}
