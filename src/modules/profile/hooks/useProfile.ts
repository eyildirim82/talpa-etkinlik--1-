import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile } from '../api/profile.api'
import { useSession } from '@/modules/auth'

// SessionStorage keys for persisting profile
const PROFILE_STORAGE_KEY = '__profile_cache__'
const PROFILE_USER_ID_KEY = '__profile_user_id__'

// Get cached profile from sessionStorage
function getCachedProfile(): any {
    try {
        const cached = sessionStorage.getItem(PROFILE_STORAGE_KEY)
        return cached ? JSON.parse(cached) : null
    } catch {
        return null
    }
}

function getCachedUserId(): string | null {
    try {
        return sessionStorage.getItem(PROFILE_USER_ID_KEY)
    } catch {
        return null
    }
}

// Save profile to sessionStorage
function setCachedProfile(profile: any, userId: string): void {
    try {
        sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
        sessionStorage.setItem(PROFILE_USER_ID_KEY, userId)
    } catch {
        // Ignore storage errors
    }
}

export const useProfile = () => {
    const { user, isLoading: isAuthLoading } = useSession()
    const queryClient = useQueryClient()

    // Check existing QueryClient cache AND sessionStorage
    const existingProfile = user?.id ? queryClient.getQueryData(['profile', user.id]) : null
    const storedProfile = getCachedProfile()
    const storedUserId = getCachedUserId()

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            const result = await getProfile(user!.id)
            // Update sessionStorage cache
            setCachedProfile(result, user!.id)
            return result
        },
        enabled: !!user?.id,
        // Use cached data as placeholder to prevent loading flash
        placeholderData: () => {
            if (existingProfile) return existingProfile
            if (user?.id && storedUserId === user.id && storedProfile) return storedProfile
            return undefined
        },
    })

    // Smart loading calculation - never show loading if we have ANY cached data
    const hasMatchingStoredProfile = user?.id && storedUserId === user.id && storedProfile
    const hasAnyData = !!(profile || existingProfile || hasMatchingStoredProfile)
    const isLoading = !hasAnyData && (isAuthLoading || (!!user && isProfileLoading))

    // Return the best available data
    const userData = profile || existingProfile || (hasMatchingStoredProfile ? storedProfile : null)

    return {
        user: userData,
        isLoading,
        isAuthenticated: !!user
    }
}

