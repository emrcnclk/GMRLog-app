import { legalAcknowledgementRecordSchema, legalConsentRecordSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** `POST /me/legal-consents` body. */
export class LegalConsentRecordDto extends createZodDto(legalConsentRecordSchema) {}

/** `POST /me/legal-consents/acknowledgements` body (12.4b). */
export class LegalAcknowledgementRecordDto extends createZodDto(legalAcknowledgementRecordSchema) {}
