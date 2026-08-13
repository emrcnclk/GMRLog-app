import { sharedEnvSchema } from '@gmrlog/config';
import { z } from 'zod';

/** Convenience for local development only — production boot rejects it (F6.7 fail-closed). */
const DEV_ONLY_JWT_SECRET = 'gmrlog-development-only-secret-do-not-use-in-production';

/** Explicit production keys — defaults must not silently substitute (D3.20). */
export const PRODUCTION_REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'S3_BUCKET',
  'S3_ENDPOINT',
  'SMTP_HOST',
  'MEILI_HOST',
] as const;

/**
 * Backend platform environment (D3.19 / D3.20). Storage · search · mail · observability
 * keys ship with local MinIO / Mailpit / Meilisearch defaults.
 */
export const backendEnvSchema = sharedEnvSchema
  .extend({
    APP_VERSION: z.string().default('0.0.0-dev'),
    API_HOST: z.string().default('0.0.0.0'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    API_GLOBAL_PREFIX: z.string().default('api/v1'),
    API_DOCS_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      ),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://gmrlog:gmrlog@localhost:5432/gmrlog?schema=public'),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(32).default(DEV_ONLY_JWT_SECRET),
    JWT_ISSUER: z.string().default('gmrlog'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),
    MEDIA_PUBLIC_BASE_URL: z.string().url().default('http://localhost:9000/gmrlog/'),
    S3_BUCKET: z.string().default('gmrlog'),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY: z.string().default('gmrlog'),
    S3_SECRET_KEY: z.string().default('gmrlogsecret'),
    S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
    S3_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    MEILI_HOST: z.string().default(''),
    MEILI_API_KEY: z.string().default(''),
    MEILI_INDEX_PREFIX: z.string().default('gmrlog'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USERNAME: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    SMTP_FROM: z.string().default('noreply@gmrlog.local'),
    PASSWORD_RESET_URL_BASE: z.string().url().default('http://localhost:3000/reset-password'),
    PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(3600),

    // -----------------------------------------------------------------------
    // OAuth login providers (D4.3 / OAUTH.md). Empty client id/secret leaves
    // the provider disabled — /start answers 503 rather than silently
    // offering a flow that can never complete.
    // -----------------------------------------------------------------------
    GOOGLE_OAUTH_CLIENT_ID: z.string().default(''),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().default(''),
    /** Comma-separated allowlist a client-supplied `redirectUri` must match exactly. */
    GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((uri) => uri.trim())
          .filter((uri) => uri.length > 0),
      ),
    // Discord (task 4.4) — login only, minimum scope for subject + verified
    // email. Never request `guilds` or anything an import/connect flow would
    // need; that's a separate, not-yet-built surface (OAUTH.md §1).
    DISCORD_OAUTH_CLIENT_ID: z.string().default(''),
    DISCORD_OAUTH_CLIENT_SECRET: z.string().default(''),
    DISCORD_OAUTH_ALLOWED_REDIRECT_URIS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((uri) => uri.trim())
          .filter((uri) => uri.length > 0),
      ),
    OAUTH_STATE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    SENTRY_DSN: z.string().default(''),
    LOG_FILE: z.string().default(''),
    METRICS_TOKEN: z.string().default(''),

    // -----------------------------------------------------------------------
    // Game catalog metadata (D3.25 — docs/18_CATALOG/).
    // Every key has a safe default: an unconfigured provider chain leaves games
    // at `metadata_status = 'pending'` and changes no existing behaviour.
    // -----------------------------------------------------------------------
    IGDB_CLIENT_ID: z.string().default(''),
    IGDB_CLIENT_SECRET: z.string().default(''),
    IGDB_RATE_LIMIT_RPS: z.coerce.number().positive().default(4),
    STEAM_STORE_METADATA_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    STEAM_STORE_RATE_LIMIT_RPS: z.coerce.number().positive().default(1),
    /** RAWG stays off until the licensing question in METADATA_LICENSING.md §4 is answered. */
    RAWG_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    RAWG_API_KEY: z.string().default(''),
    RAWG_RATE_LIMIT_RPS: z.coerce.number().positive().default(2),

    METADATA_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.55),
    METADATA_COMPLETE_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.8),
    METADATA_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    METADATA_BACKFILL_BATCH_SIZE: z.coerce.number().int().positive().max(5000).default(200),
    METADATA_REFRESH_BATCH_SIZE: z.coerce.number().int().positive().max(5000).default(500),
    METADATA_REFRESH_INTERVAL_DAYS: z.coerce.number().int().positive().default(30),
    GAME_METADATA_WORKER_CONCURRENCY: z.coerce.number().int().positive().max(32).default(2),
    GAME_MEDIA_WORKER_CONCURRENCY: z.coerce.number().int().positive().max(32).default(4),

    MEDIA_INGEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    MEDIA_INGEST_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(8 * 1024 * 1024),
    MEDIA_INGEST_MAX_SCREENSHOTS: z.coerce.number().int().nonnegative().default(12),
    MEDIA_INGEST_MAX_ARTWORKS: z.coerce.number().int().nonnegative().default(4),
  })
  .superRefine((value, ctx) => {
    if (!isProductionRuntime(value)) {
      return;
    }
    if (value.JWT_SECRET === DEV_ONLY_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET must be set in production',
        path: ['JWT_SECRET'],
      });
    }
    if (value.MEILI_HOST.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MEILI_HOST must be set in production',
        path: ['MEILI_HOST'],
      });
    }
  });

export type BackendEnv = z.infer<typeof backendEnvSchema>;

function isProductionRuntime(value: Pick<BackendEnv, 'NODE_ENV' | 'APP_ENV'>): boolean {
  return value.NODE_ENV === 'production' || value.APP_ENV === 'production';
}

function assertProductionRequiredKeys(source: Record<string, string | undefined>): void {
  const missing = PRODUCTION_REQUIRED_ENV_KEYS.filter((key) => {
    const raw = source[key];
    return raw === undefined || raw.trim().length === 0;
  });
  if (missing.length > 0) {
    throw new Error(
      `Invalid backend environment — missing required production keys: ${missing.join(', ')}`,
    );
  }
}

export function parseBackendEnv(source: Record<string, string | undefined>): BackendEnv {
  const result = backendEnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend environment — ${details}`);
  }
  if (isProductionRuntime(result.data)) {
    assertProductionRequiredKeys(source);
  }
  return result.data;
}
