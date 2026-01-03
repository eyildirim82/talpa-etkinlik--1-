import { useQuery } from '@tanstack/react-query'
import { useProfile } from './useProfile'

/**
 * Hook to check if current user is admin
 */
export function useAdmin() {
    const { user, isLoading } = useProfile()
    
    const isAdmin = useQuery({
        queryKey: ['isAdmin', user?.id],
        queryFn: () => {
            return user?.is_admin ?? false
        },
        enabled: !!user && !isLoading,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    return {
        isAdmin: isAdmin.data ?? false,
        isLoading: isLoading || isAdmin.isLoading,
    }
}

