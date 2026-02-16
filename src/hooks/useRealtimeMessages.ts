import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Message {
  id: string
  conversation_id?: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  updated_at: string
  read_at?: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  org_sender_name?: string
}

interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  new: Message
  old?: Message
}

export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = useRef<any>(null)
  const subscription = useRef<any>(null)

  useEffect(() => {
    // Initialize Supabase client
    supabase.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Subscribe to messages for this conversation
    const channel = `messages:conversation_id=eq.${conversationId}`
    subscription.current = supabase.current
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: RealtimeMessagePayload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // New message received
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === payload.new.id)
            if (!exists) {
              return [...prev, payload.new].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            }
            return prev
          })
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // Message updated (e.g., read status)
          setMessages(prev => 
            prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
          )
        } else if (payload.eventType === 'DELETE' && payload.old) {
          // Message deleted
          setMessages(prev => prev.filter(msg => msg.id !== payload.old!.id))
        }
      })
      .subscribe()

    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe()
      }
    }
  }, [conversationId])

  return messages
}
