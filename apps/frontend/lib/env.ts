import { z } from 'zod';

/**
 * Frontend public env (Expo). Secrets never live here.
 * APP_ENV aligns with shared runtime vocabulary (MONOREPO_STRUCTURE).
 */
export const frontendEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  EXPO_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  EXPO_PUBLIC_SOCKET_URL: z.string().url().default('http://localhost:4000'),
});

export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

function readEnv(name: string): string | undefined {
  const value: unknown = process.env[name];
  return typeof value === 'string' ? value : undefined;
}

export function loadFrontendEnv(
  source: Record<string, string | undefined> = {
    APP_ENV: readEnv('APP_ENV') ?? readEnv('EXPO_PUBLIC_APP_ENV'),
    EXPO_PUBLIC_API_URL: readEnv('EXPO_PUBLIC_API_URL'),
    EXPO_PUBLIC_SOCKET_URL: readEnv('EXPO_PUBLIC_SOCKET_URL'),
  },
): FrontendEnv {
  const result = frontendEnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid frontend environment — ${details}`);
  }
  return result.data;
}
