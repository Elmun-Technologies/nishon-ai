'use client'
import { useEffect } from 'react'
import { getSocket, joinWorkspace } from '@/lib/socket'

/**
 * Hook that connects to the WebSocket and calls `onRefresh` when
 * any of the given socket events fire for this workspace.
 *
 * Usage:
 *   useRealtimeRefresh(workspaceId, ['meta_synced', 'optimization_done'], fetchData)
 */
export function useRealtimeRefresh(
  workspaceId: string | undefined,
  events: string[],
  onRefresh: () => void,
) {
  useEffect(() => {
    if (!workspaceId) return

    const socket = getSocket()
    if (!socket) return

    joinWorkspace(workspaceId)

    const handlers: Array<() => void> = events.map((event) => {
      const handler = (data: any) => {
        if (!data?.workspaceId || data.workspaceId === workspaceId) {
          onRefresh()
        }
      }
      socket.on(event, handler)
      return () => socket.off(event, handler)
    })

    return () => {
      handlers.forEach((cleanup) => cleanup())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])
}
