/**
 * Event Admin Hooks
 * React Query hooks for admin event operations
 * 
 * @module event/hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getAllEventsAdmin,
    createEventAdmin,
    updateEventAdmin,
    deleteEventAdmin,
    setActiveEventAdmin,
    type AdminEvent
} from '../api/event.admin.api'
import type { CreateEventData } from '../types/event.types'

/**
 * Query key for event admin operations
 */
export const EVENT_ADMIN_QUERY_KEY = ['event', 'admin'] as const

/**
 * Hook to get all events for admin dashboard
 */
export function useAdminEvents() {
    return useQuery({
        queryKey: [...EVENT_ADMIN_QUERY_KEY, 'list'],
        queryFn: getAllEventsAdmin,
    })
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (eventData: CreateEventData) => createEventAdmin(eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
        },
    })
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, ...updates }: Partial<AdminEvent> & { id: number }) =>
            updateEventAdmin(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
        },
    })
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (eventId: number) => deleteEventAdmin(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
        },
    })
}

/**
 * Hook to set an event as active
 */
export function useSetActiveEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (eventId: number) => setActiveEventAdmin(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin'] })
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
        },
    })
}
