import { uploadConfirmSchema, uploadGrantSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.24 UploadGrantRequest. */
export class UploadGrantDto extends createZodDto(uploadGrantSchema) {}

/** S1 §14.25 UploadConfirmRequest. */
export class UploadConfirmDto extends createZodDto(uploadConfirmSchema) {}
