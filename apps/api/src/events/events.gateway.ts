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
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

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
 *
 * Authentication: pass JWT via socket handshake auth or Authorization header:
 *   io('https://api...', { auth: { token: 'Bearer <jwt>' } })
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (same-origin / server-side)
      if (!origin) return callback(null, true)
      const frontendUrl = process.env.FRONTEND_URL || ''
      const allowed = frontendUrl
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
      if (allowed.length === 0 || allowed.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error(`Origin ${origin} not allowed`))
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(EventsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    if (!this.authenticateSocket(client)) {
      this.logger.warn(`Unauthorized WebSocket connection attempt: ${client.id}`)
      client.emit('error', { message: 'Unauthorized' })
      client.disconnect(true)
      return
    }
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
    const userId = this.getUserIdFromSocket(client)
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' })
      return
    }

    const room = `workspace:${data.workspaceId}`
    client.join(room)
    this.logger.log(`Client ${client.id} (user ${userId}) joined room ${room}`)
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

  private authenticateSocket(client: Socket): boolean {
    try {
      const token = this.extractTokenFromSocket(client)
      if (!token) return false
      const secret = this.configService.get<string>('JWT_SECRET', '')
      this.jwtService.verify(token, { secret })
      return true
    } catch {
      return false
    }
  }

  private getUserIdFromSocket(client: Socket): string | null {
    try {
      const token = this.extractTokenFromSocket(client)
      if (!token) return null
      const secret = this.configService.get<string>('JWT_SECRET', '')
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret })
      return payload.sub
    } catch {
      return null
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // Try handshake auth.token first (preferred)
    const authToken = (client.handshake as any)?.auth?.token as string | undefined
    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, '')
    }
    // Fallback: Authorization header
    const authHeader = client.handshake?.headers?.authorization as string | undefined
    if (authHeader) {
      return authHeader.replace(/^Bearer\s+/i, '')
    }
    return null
  }
}
