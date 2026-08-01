import type { ApiEnvelope, ApiErrorEnvelope } from '@gmrlog/types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiSdkConfig {
  baseUrl: string;
  /** Access token attachment — session foundation supplies the current token. */
  getAccessToken?: () => string | null | Promise<string | null>;
  /** Optional client-supplied request id; otherwise the SDK generates one. */
  createRequestId?: () => string;
  /**
   * 401 handling placeholder (D1.4). Called once per request on an `authn`
   * failure; return `true` after recovering the session (e.g. refresh) to have
   * the SDK retry the request exactly once. The real refresh algorithm is a
   * D2+ concern — the pipeline hook is the foundation.
   */
  onUnauthorized?: (error: ApiSdkError) => boolean | Promise<boolean>;
}

export interface ApiRequestOptions {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * S1 §10 — Idempotency-Key for create intents.
   * Placeholder only in D1.3; domains pass keys when they exist.
   */
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Internal — set on the single post-recovery retry so 401 handling never loops. */
  skipUnauthorizedRecovery?: boolean;
}

export class ApiSdkError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly envelope: ApiErrorEnvelope | null,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'ApiSdkError';
  }
}

function defaultRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildUrl(baseUrl: string, path: string, query?: ApiRequestOptions['query']): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Shared API transport. Screens never call fetch/axios directly (F6.2 §11).
 * OpenAPI-generated operations arrive later — this client is the sole HTTP surface.
 */
export class ApiClient {
  constructor(private readonly config: ApiSdkConfig) {}

  async request<T>(options: ApiRequestOptions): Promise<ApiEnvelope<T>> {
    try {
      return await this.performRequest<T>(options);
    } catch (error) {
      // Request retry placeholder — one recovery attempt on authn failure only.
      if (
        error instanceof ApiSdkError &&
        error.status === 401 &&
        !options.skipUnauthorizedRecovery &&
        this.config.onUnauthorized
      ) {
        const recovered = await this.config.onUnauthorized(error);
        if (recovered) {
          return this.performRequest<T>({ ...options, skipUnauthorizedRecovery: true });
        }
      }
      throw error;
    }
  }

  private async performRequest<T>(options: ApiRequestOptions): Promise<ApiEnvelope<T>> {
    const requestId = this.config.createRequestId?.() ?? defaultRequestId();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Gmrlog-Request-Id': requestId,
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const token = await this.config.getAccessToken?.();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl(this.config.baseUrl, options.path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    const responseRequestId = response.headers.get('x-gmrlog-request-id') ?? requestId;
    const text = await response.text();
    const parsed: unknown = text.length === 0 ? null : (JSON.parse(text) as unknown);

    if (!response.ok) {
      const errorEnvelope =
        parsed !== null && typeof parsed === 'object' && 'error' in parsed
          ? (parsed as ApiErrorEnvelope)
          : null;
      throw new ApiSdkError(
        errorEnvelope?.error.message ?? `Request failed with status ${String(response.status)}`,
        response.status,
        errorEnvelope,
        responseRequestId,
      );
    }

    if (parsed !== null && typeof parsed === 'object' && 'data' in parsed && 'meta' in parsed) {
      return parsed as ApiEnvelope<T>;
    }

    // Tolerate raw payloads during foundation; domains must still prefer S1 envelopes.
    return {
      data: parsed as T,
      meta: { requestId: responseRequestId },
    };
  }

  get<T>(path: string, query?: ApiRequestOptions['query']): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'GET', path, query });
  }

  post<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'POST', path, body, idempotencyKey });
  }

  delete<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'DELETE', path });
  }
}

export function createApiClient(config: ApiSdkConfig): ApiClient {
  return new ApiClient(config);
}
