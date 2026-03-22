import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'

/**
 * EventsGateway — real-time WebSocket server.
 *
 * Clients connect and join their workspace room:
 *   socket.emit('join', { workspaceId: 'uuid' })
 *
 * Then they receive live events:
 *   - 'ai_decision_created'  — new AI decision logged
 *   - 'campaign_updated'     — campaign status changed
 *   - 'meta_synced'          — Meta Ads data refreshed
 *   - 'optimization_done'    — optimization loop finished
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(EventsGateway.name)

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /** Client joins a workspace-specific room to receive workspace events */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { workspaceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `workspace:${data.workspaceId}`
    client.join(room)
    this.logger.log(`Client ${client.id} joined room ${room}`)
    client.emit('joined', { room })
  }

  /** Emit an event to all clients in a workspace room */
  emitToWorkspace(workspaceId: string, event: string, payload: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, payload)
  }

  /** Broadcast to ALL connected clients */
  broadcast(event: string, payload: any) {
    this.server.emit(event, payload)
  }
}
