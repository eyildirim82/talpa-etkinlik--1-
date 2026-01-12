import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Internal state interface
interface SessionState {
  user: User | null
  session: Session | null
}

// SessionStorage key for persisting session
const SESSION_STORAGE_KEY = '__session_cache__'

// Track last visibility change to ignore SIGNED_IN events triggered by tab focus
let lastVisibilityChangeTime = 0
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastVisibilityChangeTime = Date.now()
    }
  })
}

// Get cached session from sessionStorage (survives tab freeze/unfreeze)
function getCachedSession(): SessionState | null {
  try {
    const cached = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

// Save session to sessionStorage
function setCachedSession(session: SessionState): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to get current authentication session
 */
export function useSession() {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  // Check if we have existing data in QueryClient cache OR sessionStorage
  const existingData = queryClient.getQueryData<SessionState>(['session'])
  const storedSession = getCachedSession()

  const { data: session, isLoading: isQueryLoading } = useQuery<SessionState>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      const result = {
        user: session?.user ?? null,
        session: session,
      }
      // Cache the session to sessionStorage
      setCachedSession(result)
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Use placeholderData callback to get cached data on every render
    placeholderData: () => existingData ?? storedSession ?? undefined,
  })

  // Determine actual loading state - not loading if we have any cached data
  const hasAnyCache = !!(session || existingData || storedSession)
  const isLoading = isQueryLoading && !hasAnyCache

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Check if this is a spurious SIGNED_IN triggered by tab focus
      const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeTime
      const isSpuriousSignIn = event === 'SIGNED_IN' && timeSinceVisibilityChange < 1000
      
      // Ignore spurious SIGNED_IN events triggered by tab focus
      if (isSpuriousSignIn) {
        return
      }
      
      // Update sessionStorage cache
      const sessionData: SessionState = {
        user: session?.user ?? null,
        session: session,
      }
      setCachedSession(sessionData)
      queryClient.setQueryData(['session'], sessionData)

      // Only invalidate profile when user actually signs in or out
      // We ignore TOKEN_REFRESHED and USER_UPDATED to prevent "reload" effect on window focus
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      }
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

