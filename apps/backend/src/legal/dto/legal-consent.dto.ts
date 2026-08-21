import { legalConsentRecordSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** `POST /me/legal-consents` body. */
export class LegalConsentRecordDto extends createZodDto(legalConsentRecordSchema) {}
