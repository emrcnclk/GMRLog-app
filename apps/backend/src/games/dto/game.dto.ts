import { gameIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** Path param for `/games/{id}`. */
export class GameIdParamDto extends createZodDto(gameIdParamSchema) {}
