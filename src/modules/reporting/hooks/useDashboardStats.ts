/**
 * Dashboard Stats Hooks
 * React Query hooks for dashboard statistics
 * 
 * @module reporting/hooks
 */
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getEventStats } from '../api/reporting.api'

/**
 * Query key for reporting operations
 */
export const REPORTING_QUERY_KEY = ['reporting'] as const

/**
 * Hook to get dashboard statistics for admin overview
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: [...REPORTING_QUERY_KEY, 'dashboard'],
        queryFn: getDashboardStats,
    })
}

/**
 * Hook to get event-specific statistics
 */
export function useEventStats(eventId: number | null) {
    return useQuery({
        queryKey: [...REPORTING_QUERY_KEY, 'event', eventId],
        queryFn: () => eventId ? getEventStats(eventId) : Promise.resolve(null),
        enabled: !!eventId,
    })
}
