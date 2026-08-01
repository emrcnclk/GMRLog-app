import {
  tierListCreateSchema,
  tierListIdParamSchema,
  tierListPatchSchema,
  tierListSlotsPutSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.12 TierListCreateRequest. */
export class TierListCreateDto extends createZodDto(tierListCreateSchema) {}

/** PATCH allowlist for `/tier-lists/{id}`. */
export class TierListPatchDto extends createZodDto(tierListPatchSchema) {}

/** Path param for `/tier-lists/{id}`. */
export class TierListIdParamDto extends createZodDto(tierListIdParamSchema) {}

/** S1 §14.12 slots Put. */
export class TierListSlotsPutDto extends createZodDto(tierListSlotsPutSchema) {}
