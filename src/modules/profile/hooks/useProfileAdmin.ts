/**
 * Profile Admin Hooks
 * React Query hooks for admin user/profile operations
 * 
 * @module profile/hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getAllUsersAdmin,
    updateUserRoleAdmin,
    getUserByIdAdmin,
    searchUsersAdmin,
} from '../api/profile.admin.api'

/**
 * Query key for profile admin operations
 */
export const PROFILE_ADMIN_QUERY_KEY = ['profile', 'admin'] as const

/**
 * Hook to get all users for admin dashboard
 */
export function useAdminUsers() {
    return useQuery({
        queryKey: [...PROFILE_ADMIN_QUERY_KEY, 'list'],
        queryFn: getAllUsersAdmin,
    })
}

/**
 * Hook to get a user by ID (admin)
 */
export function useAdminUser(userId: string | null) {
    return useQuery({
        queryKey: [...PROFILE_ADMIN_QUERY_KEY, 'user', userId],
        queryFn: () => userId ? getUserByIdAdmin(userId) : Promise.resolve(null),
        enabled: !!userId,
    })
}

/**
 * Hook to search users (admin)
 */
export function useSearchUsersAdmin(query: string) {
    return useQuery({
        queryKey: [...PROFILE_ADMIN_QUERY_KEY, 'search', query],
        queryFn: () => searchUsersAdmin(query),
        enabled: query.length >= 2,
    })
}

/**
 * Hook to update user role (admin)
 */
export function useUpdateUserRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) =>
            updateUserRoleAdmin(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROFILE_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
        },
    })
}
