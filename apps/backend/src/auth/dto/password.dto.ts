import {
  passwordForgotSchema,
  passwordResetSchema,
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

/** S1 — password forgot request. */
export class PasswordForgotDto extends createZodDto(passwordForgotSchema) {}

/** S1 — password reset request. */
export class PasswordResetDto extends createZodDto(passwordResetSchema) {}
