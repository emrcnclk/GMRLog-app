import {
  settingsAccessibilityPatchSchema,
  settingsAppearancePatchSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.23 — appearance patch (allowlisted fields only). */
export class SettingsAppearancePatchDto extends createZodDto(settingsAppearancePatchSchema) {}

/** S1 §14.23 — accessibility patch (allowlisted fields only). */
export class SettingsAccessibilityPatchDto extends createZodDto(settingsAccessibilityPatchSchema) {}
