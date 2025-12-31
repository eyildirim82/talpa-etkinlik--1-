import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Types
export interface AdminStats {
    totalEvents: number;
    activeEvent: { id: number; title: string } | null;
    totalBookings: number;
    asilCount: number;
    yedekCount: number;
    paidCount: number;
    totalRevenue: number;
    occupancyRate: number;
}

export interface AdminEvent {
    id: number;
    title: string;
    description: string | null;
    banner_image: string | null;
    event_date: string;
    location_url: string | null;
    price: number;
    quota_asil: number;
    quota_yedek: number;
    cut_off_date: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    created_at: string;
    updated_at: string;
    asil_count?: number;
    yedek_count?: number;
    paid_count?: number;
    // Backward compatibility
    image_url?: string | null;
    location?: string | null;
    total_quota?: number;
    is_active?: boolean;
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

            // Get booking counts for each event
            const eventsWithCounts = await Promise.all(
                (data || []).map(async (event) => {
                    const { count: asilCount } = await supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)
                        .eq('queue_status', 'ASIL');

                    const { count: yedekCount } = await supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)
                        .eq('queue_status', 'YEDEK');

                    const { count: paidCount } = await supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)
                        .eq('payment_status', 'PAID');

                    return { 
                        ...event, 
                        asil_count: asilCount || 0,
                        yedek_count: yedekCount || 0,
                        paid_count: paidCount || 0,
                        // Backward compatibility
                        image_url: event.banner_image,
                        location: event.location_url,
                        total_quota: event.quota_asil + event.quota_yedek,
                        is_active: event.status === 'ACTIVE',
                        sold_tickets: (asilCount || 0) + (yedekCount || 0)
                    };
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

            const activeEvent = events?.find(e => e.status === 'ACTIVE') || null;

            // Get all bookings
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('*, events!inner(price)')
                .in('queue_status', ['ASIL', 'YEDEK']);

            if (bookingsError) throw bookingsError;

            const totalBookings = bookings?.length || 0;
            const asilCount = bookings?.filter((b: any) => b.queue_status === 'ASIL').length || 0;
            const yedekCount = bookings?.filter((b: any) => b.queue_status === 'YEDEK').length || 0;
            const paidCount = bookings?.filter((b: any) => b.payment_status === 'PAID').length || 0;
            const totalRevenue = bookings?.reduce((sum, b: any) => {
                if (b.payment_status === 'PAID') {
                    return sum + (b.events?.price || 0);
                }
                return sum;
            }, 0) || 0;

            // Calculate occupancy for active event
            let occupancyRate = 0;
            if (activeEvent) {
                const activeEventBookings = bookings?.filter((b: any) => b.event_id === activeEvent.id).length || 0;
                const totalQuota = activeEvent.quota_asil + activeEvent.quota_yedek;
                occupancyRate = totalQuota > 0
                    ? Math.round((activeEventBookings / totalQuota) * 100)
                    : 0;
            }

            return {
                totalEvents: events?.length || 0,
                activeEvent: activeEvent ? { id: activeEvent.id, title: activeEvent.title } : null,
                totalBookings,
                asilCount,
                yedekCount,
                paidCount,
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
 * Set active event (uses RPC function)
 */
export function useSetActiveEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: number) => {
            const { data, error } = await supabase.rpc('set_active_event', {
                p_event_id: eventId
            });

            if (error) throw error;
            if (!data.success) {
                throw new Error(data.error || 'Etkinlik aktif edilemedi.');
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
        mutationFn: async (event: Omit<AdminEvent, 'id' | 'created_at' | 'updated_at' | 'asil_count' | 'yedek_count' | 'paid_count' | 'sold_tickets' | 'image_url' | 'location' | 'total_quota' | 'is_active'>) => {
            const { data, error } = await supabase
                .from('events')
                .insert({
                    title: event.title,
                    description: event.description,
                    banner_image: event.banner_image,
                    event_date: event.event_date,
                    location_url: event.location_url,
                    price: event.price,
                    quota_asil: event.quota_asil,
                    quota_yedek: event.quota_yedek,
                    cut_off_date: event.cut_off_date,
                    status: event.status || 'DRAFT'
                })
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
        mutationFn: async ({ id, ...updates }: Partial<AdminEvent> & { id: number }) => {
            // Map backward compatibility fields
            const updateData: any = {};
            if (updates.title !== undefined) updateData.title = updates.title;
            if (updates.description !== undefined) updateData.description = updates.description;
            if (updates.banner_image !== undefined) updateData.banner_image = updates.banner_image;
            if (updates.image_url !== undefined) updateData.banner_image = updates.image_url; // Backward compat
            if (updates.event_date !== undefined) updateData.event_date = updates.event_date;
            if (updates.location_url !== undefined) updateData.location_url = updates.location_url;
            if (updates.location !== undefined) updateData.location_url = updates.location; // Backward compat
            if (updates.price !== undefined) updateData.price = updates.price;
            if (updates.quota_asil !== undefined) updateData.quota_asil = updates.quota_asil;
            if (updates.quota_yedek !== undefined) updateData.quota_yedek = updates.quota_yedek;
            if (updates.cut_off_date !== undefined) updateData.cut_off_date = updates.cut_off_date;
            if (updates.status !== undefined) updateData.status = updates.status;
            if (updates.is_active !== undefined) {
                // Backward compatibility: convert is_active to status
                updateData.status = updates.is_active ? 'ACTIVE' : 'ARCHIVED';
            }

            const { data, error } = await supabase
                .from('events')
                .update(updateData)
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
        mutationFn: async (eventId: number) => {
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
