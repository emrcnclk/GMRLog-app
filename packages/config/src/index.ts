import { z } from 'zod';

/**
 * Shared runtime environment keys only (MONOREPO_STRUCTURE).
 * App-specific env schemas are added when frontend/backend foundations land.
 */
export const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

export function loadSharedEnv(source: Record<string, string | undefined> = process.env): SharedEnv {
  return sharedEnvSchema.parse(source);
}
