import type { WorkspacePackageName } from '@gmrlog/types';

export const apiSdkPackageName = 'api-sdk' as const satisfies WorkspacePackageName;

export {
  ApiClient,
  ApiSdkError,
  createApiClient,
  type ApiRequestOptions,
  type ApiSdkConfig,
  type HttpMethod,
} from './client.js';

export {
  AuthClient,
  createAuthClient,
  type LoginInput,
  type SessionTokens,
} from './auth-client.js';

export { LegalClient, createLegalClient } from './legal-client.js';
