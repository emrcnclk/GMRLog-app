import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { AppLogger } from '../logging/app-logger.service';

/**
 * Realtime bootstrap. A delivery channel only (F6.3 §5.6) — no events, no
 * rooms, no domain meaning. Domain event vocabularies arrive with D2+/D3.
 */
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly logger: AppLogger) {}

  afterInit(): void {
    this.logger.log('Realtime gateway initialized', RealtimeGateway.name);
  }

  handleConnection(client: Socket): void {
    this.logger.event('debug', { clientId: client.id }, 'realtime client connected');
  }

  handleDisconnect(client: Socket): void {
    this.logger.event('debug', { clientId: client.id }, 'realtime client disconnected');
  }
}
