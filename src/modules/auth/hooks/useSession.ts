import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthSession {
  user: User | null
  session: Session | null
}

/**
 * Hook to get current authentication session
 */
export function useSession() {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery<AuthSession>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return {
        user: session?.user ?? null,
        session: session,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(['session'], {
        user: session?.user ?? null,
        session: session,
      })
      // Invalidate profile when auth state changes
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isLoading,
  }
}

