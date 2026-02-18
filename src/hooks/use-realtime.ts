'use client'

import { useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeConfig {
  channel: string
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
}

export function useRealtime({
  channel,
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: RealtimeConfig) {
  const supabase = getSupabaseBrowserClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const dbChannel = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload)
              break
            case 'UPDATE':
              onUpdate?.(payload)
              break
            case 'DELETE':
              onDelete?.(payload)
              break
          }
        }
      )
      .subscribe()

    channelRef.current = dbChannel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [channel, table, event, filter, onInsert, onUpdate, onDelete, supabase])

  return channelRef
}
