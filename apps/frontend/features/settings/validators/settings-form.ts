import {
  settingsAccessibilityPatchSchema,
  settingsAppearancePatchSchema,
} from '@gmrlog/validators';
import { z } from 'zod';

/** Appearance form — wraps shared appearance patch + local display helpers. */
export const appearanceFormSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
    locale: z.string().trim().max(35),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.locale.length > 0 && value.locale.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Locale must be at least 2 characters',
        path: ['locale'],
      });
    }
  });

export type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export function toAppearancePatch(values: AppearanceFormValues) {
  const locale = values.locale.trim().length === 0 ? null : values.locale.trim();
  return settingsAppearancePatchSchema.parse({
    theme: values.theme,
    locale,
  });
}

export const accessibilityFormSchema = settingsAccessibilityPatchSchema;

export type AccessibilityFormValues = z.infer<typeof accessibilityFormSchema>;

/** Local-only UI prefs — never sent to backend. */
export const localUiPrefsSchema = z
  .object({
    largerText: z.boolean(),
    highContrast: z.boolean(),
    dateFormat: z.enum(['system', 'ymd', 'mdy', 'dmy']),
    region: z.string().trim().min(2).max(8).nullable(),
  })
  .strict();

export type LocalUiPrefs = z.infer<typeof localUiPrefsSchema>;

export const DEFAULT_LOCAL_UI_PREFS: LocalUiPrefs = {
  largerText: false,
  highContrast: false,
  dateFormat: 'system',
  region: null,
};
