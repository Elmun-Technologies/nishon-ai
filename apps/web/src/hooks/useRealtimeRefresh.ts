'use client'
import { useEffect, useRef } from 'react'
import { getSocket, joinWorkspace } from '@/lib/socket'

/**
 * Hook that connects to the WebSocket and calls `onRefresh` when
 * any of the given socket events fire for this workspace.
 *
 * Usage:
 *   useRealtimeRefresh(workspaceId, ['meta_synced', 'optimization_done'], fetchData)
 *
 * `onRefresh` is read through a ref so callers can pass a fresh closure each
 * render (e.g. a useCallback that depends on locale/state) without the socket
 * handler binding a stale version. Subscriptions are rebuilt only when the
 * workspace or the event list actually changes (by value, not identity).
 */
export function useRealtimeRefresh(
  workspaceId: string | undefined,
  events: string[],
  onRefresh: () => void,
) {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const eventsKey = events.join(',')

  useEffect(() => {
    if (!workspaceId) return

    const socket = getSocket()
    if (!socket) return

    joinWorkspace(workspaceId)

    const eventList = eventsKey ? eventsKey.split(',') : []
    const handlers: Array<() => void> = eventList.map((event) => {
      const handler = (data: any) => {
        if (!data?.workspaceId || data.workspaceId === workspaceId) {
          onRefreshRef.current()
        }
      }
      socket.on(event, handler)
      return () => socket.off(event, handler)
    })

    return () => {
      handlers.forEach((cleanup) => cleanup())
    }
  }, [workspaceId, eventsKey])
}
