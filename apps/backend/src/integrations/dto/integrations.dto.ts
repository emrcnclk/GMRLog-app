import {
  csvImportSchema,
  integrationCreateSchema,
  integrationIdParamSchema,
  integrationSyncSchema,
  steamConnectSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

export class SteamConnectDto extends createZodDto(steamConnectSchema) {}

export class IntegrationCreateDto extends createZodDto(integrationCreateSchema) {}

export class IntegrationSyncDto extends createZodDto(integrationSyncSchema) {}

export class IntegrationIdParamDto extends createZodDto(integrationIdParamSchema) {}

export class CsvImportDto extends createZodDto(csvImportSchema) {}
