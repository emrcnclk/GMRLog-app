import { reportCreateSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.17 ReportCreateRequest. */
export class ReportCreateDto extends createZodDto(reportCreateSchema) {}
