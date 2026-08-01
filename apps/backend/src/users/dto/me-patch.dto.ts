import { mePatchSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.5 MePatchRequest — validated by the global Zod pipe. */
export class MePatchDto extends createZodDto(mePatchSchema) {}
