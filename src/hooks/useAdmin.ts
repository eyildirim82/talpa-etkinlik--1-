import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Types
export interface AdminStats {
    totalEvents: number;
    activeEvent: { id: string; title: string } | null;
    totalTicketsSold: number;
    totalRevenue: number;
    occupancyRate: number;
}

export interface AdminEvent {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    event_date: string;
    location: string;
    price: number;
    currency: string;
    total_quota: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    sold_tickets?: number;
}

export interface AdminTicket {
    id: string;
    event_id: string;
    user_id: string;
    qr_code: string;
    status: 'pending' | 'paid' | 'cancelled';
    purchase_date: string;
    seat_number: string | null;
    gate: string | null;
    event_title?: string;
    user_name?: string;
}

export interface AdminUser {
    id: string;
    full_name: string;
    talpa_sicil_no: string | null;
    phone: string | null;
    role: 'admin' | 'member';
    created_at: string;
    updated_at: string;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Get all events for admin
 */
export function useAdminEvents() {
    return useQuery({
        queryKey: ['admin', 'events'],
        queryFn: async (): Promise<AdminEvent[]> => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get ticket counts for each event
            const eventsWithCounts = await Promise.all(
                (data || []).map(async (event) => {
                    const { count } = await supabase
                        .from('tickets')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)
                        .in('status', ['pending', 'paid']);

                    return { ...event, sold_tickets: count || 0 };
                })
            );

            return eventsWithCounts;
        },
    });
}

/**
 * Get all tickets for admin (with user and event info)
 */
export function useAdminTickets(eventId?: string) {
    return useQuery({
        queryKey: ['admin', 'tickets', eventId],
        queryFn: async (): Promise<AdminTicket[]> => {
            let query = supabase
                .from('tickets')
                .select(`
          *,
          events!inner(title),
          profiles!inner(full_name)
        `)
                .order('purchase_date', { ascending: false });

            if (eventId) {
                query = query.eq('event_id', eventId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((ticket: any) => ({
                ...ticket,
                event_title: ticket.events?.title,
                user_name: ticket.profiles?.full_name,
            }));
        },
    });
}

/**
 * Get all users for admin
 */
export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async (): Promise<AdminUser[]> => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Get dashboard stats
 */
export function useAdminStats() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async (): Promise<AdminStats> => {
            // Get all events
            const { data: events, error: eventsError } = await supabase
                .from('events')
                .select('*');

            if (eventsError) throw eventsError;

            const activeEvent = events?.find(e => e.is_active) || null;

            // Get all tickets
            const { data: tickets, error: ticketsError } = await supabase
                .from('tickets')
                .select('*, events!inner(price)')
                .in('status', ['pending', 'paid']);

            if (ticketsError) throw ticketsError;

            const totalTicketsSold = tickets?.length || 0;
            const totalRevenue = tickets?.reduce((sum, t: any) => sum + (t.events?.price || 0), 0) || 0;

            // Calculate occupancy for active event
            let occupancyRate = 0;
            if (activeEvent) {
                const activeEventTickets = tickets?.filter((t: any) => t.event_id === activeEvent.id).length || 0;
                occupancyRate = activeEvent.total_quota > 0
                    ? Math.round((activeEventTickets / activeEvent.total_quota) * 100)
                    : 0;
            }

            return {
                totalEvents: events?.length || 0,
                activeEvent: activeEvent ? { id: activeEvent.id, title: activeEvent.title } : null,
                totalTicketsSold,
                totalRevenue,
                occupancyRate,
            };
        },
    });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Set active event (direct SQL - deactivate all, then activate one)
 */
export function useSetActiveEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            // First, deactivate all events
            const { error: deactivateError } = await supabase
                .from('events')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Workaround: use neq to satisfy WHERE clause requirement

            if (deactivateError) {
                throw new Error('Etkinlikler deaktif edilirken hata: ' + deactivateError.message);
            }

            // Then, activate the selected event
            const { data, error: activateError } = await supabase
                .from('events')
                .update({ is_active: true })
                .eq('id', eventId)
                .select()
                .single();

            if (activateError) {
                throw new Error('Etkinlik aktif edilirken hata: ' + activateError.message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
        },
    });
}

/**
 * Cancel ticket (uses RPC)
 */
export function useCancelTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const { data, error } = await supabase.rpc('cancel_ticket', {
                p_ticket_id: ticketId,
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

/**
 * Create new event
 */
export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (event: Omit<AdminEvent, 'id' | 'created_at' | 'updated_at' | 'sold_tickets'>) => {
            const { data, error } = await supabase
                .from('events')
                .insert(event)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

/**
 * Update event
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<AdminEvent> & { id: string }) => {
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

/**
 * Delete event
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'member' }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}
