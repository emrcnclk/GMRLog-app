import {
  sessionCreateSchema,
  sessionRefreshSchema,
  sessionRegisterSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.1 SessionCreateRequest. */
export class SessionCreateDto extends createZodDto(sessionCreateSchema) {}

/** S1 §14.2 SessionRegisterRequest. */
export class SessionRegisterDto extends createZodDto(sessionRegisterSchema) {}

/** S1 §13.1 refresh body. */
export class SessionRefreshDto extends createZodDto(sessionRefreshSchema) {}
