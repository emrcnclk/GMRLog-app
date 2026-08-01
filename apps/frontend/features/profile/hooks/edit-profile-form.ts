import { displayNameSchema } from '@gmrlog/validators';
import { z } from 'zod';

/** Form fields — bio as string; empty clears via null on PATCH. */
export const editProfileFormSchema = z
  .object({
    displayName: displayNameSchema,
    bio: z.string().max(500),
  })
  .strict();

export type EditProfileFormValues = z.infer<typeof editProfileFormSchema>;
