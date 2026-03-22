'use client'
import { io, Socket } from 'socket.io-client'
import { env } from './env'

let socket: Socket | null = null

/**
 * Returns a singleton Socket.IO client connected to the backend.
 * Safe to call multiple times — always returns the same connection.
 */
export function getSocket(): Socket {
  if (!socket && env.apiBaseUrl) {
    socket = io(env.apiBaseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
  }
  return socket!
}

/** Join a workspace room to receive workspace-specific events */
export function joinWorkspace(workspaceId: string) {
  const s = getSocket()
  if (s) s.emit('join', { workspaceId })
}
