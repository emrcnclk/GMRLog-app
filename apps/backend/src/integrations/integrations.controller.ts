import type {
  IntegrationProviderInfo,
  SteamProfileResponse,
  SteamStatusResponse,
  SyncHistoryResponse,
  SyncJobResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { CsvImportService } from './csv-import.service';
import {
  CsvImportDto,
  IntegrationCreateDto,
  IntegrationIdParamDto,
  IntegrationSyncDto,
  SteamConnectDto,
} from './dto/integrations.dto';
import { IntegrationsService } from './integrations.service';
import { SteamConnectService } from './steam-connect.service';

/**
 * Additive `/integrations/*` routes (D3.23 / API.md).
 */
@ApiTags('integrations')
@ApiBearerAuth('bearer')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly csvImport: CsvImportService,
    private readonly steamConnect: SteamConnectService,
  ) {}

  @Get('providers')
  listProviders(): IntegrationProviderInfo[] {
    return this.integrations.listProviders();
  }

  @Get('history')
  listHistory(@CurrentUser() identity: RequestIdentity): Promise<SyncHistoryResponse[]> {
    return this.integrations.listHistory(playerIdOf(identity));
  }

  @Post('import/csv')
  importCsv(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: CsvImportDto,
  ): Promise<SyncJobResponse> {
    return this.csvImport.importCsv(playerIdOf(identity), body);
  }

  @Post('import/csv/preview')
  previewCsv(@Body() body: CsvImportDto) {
    return this.csvImport.preview(body);
  }

  @Post('steam/connect')
  connectSteam(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SteamConnectDto,
  ): Promise<UserIntegrationResponse> {
    return this.steamConnect.connect(playerIdOf(identity), body);
  }

  @Post('steam/disconnect')
  @HttpCode(204)
  async disconnectSteam(@CurrentUser() identity: RequestIdentity): Promise<void> {
    await this.steamConnect.disconnect(playerIdOf(identity));
  }

  @Get('steam/status')
  steamStatus(@CurrentUser() identity: RequestIdentity): Promise<SteamStatusResponse> {
    return this.steamConnect.status(playerIdOf(identity));
  }

  @Get('steam/profile')
  steamProfile(@CurrentUser() identity: RequestIdentity): Promise<SteamProfileResponse> {
    return this.steamConnect.profile(playerIdOf(identity));
  }

  @Post()
  create(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: IntegrationCreateDto,
  ): Promise<UserIntegrationResponse> {
    return this.integrations.create(playerIdOf(identity), body);
  }

  @Get()
  list(@CurrentUser() identity: RequestIdentity): Promise<UserIntegrationResponse[]> {
    return this.integrations.list(playerIdOf(identity));
  }

  @Post(':id/sync')
  sync(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: IntegrationIdParamDto,
    @Body() body: IntegrationSyncDto,
  ): Promise<SyncJobResponse> {
    return this.integrations.triggerSync(playerIdOf(identity), params.id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: IntegrationIdParamDto,
  ): Promise<void> {
    await this.integrations.delete(playerIdOf(identity), params.id);
  }
}
