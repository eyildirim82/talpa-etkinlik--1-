import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile } from '../api/profile.api'
import { useSession } from '@/modules/auth'

export const useProfile = () => {
    const { user, isLoading: isAuthLoading } = useSession()
    const queryClient = useQueryClient()

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: () => getProfile(user!.id),
        enabled: !!user?.id,
    })

    return {
        user: profile,
        isLoading: isAuthLoading || (!!user && isProfileLoading),
        isAuthenticated: !!user
    }
}

