// Client-side booking actions for queue-based system

import { createClient } from '../utils/supabase/browser';
import { QueueStatus, PaymentStatus } from '../types';

export interface JoinEventResult {
  success: boolean;
  queue?: QueueStatus;
  message: string;
}

export interface Booking {
  id: number;
  event_id: number;
  user_id: string;
  booking_date: string;
  queue_status: QueueStatus;
  payment_status: PaymentStatus;
  consent_kvkk: boolean;
  consent_payment: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Join event queue system
 * Calls join_event RPC function which handles race conditions and queue assignment
 */
export async function joinEvent(
  eventId: number,
  consentKvkk: boolean,
  consentPayment: boolean
): Promise<JoinEventResult> {
  const supabase = createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' };
  }

  // 2. Validate consents
  if (!consentKvkk || !consentPayment) {
    return { success: false, message: 'KVKK ve ödeme onaylarını vermelisiniz.' };
  }

  try {
    // 3. Call Database RPC - Returns JSON with status, queue, or error
    const { data, error } = await supabase.rpc('join_event', {
      event_id_param: eventId
    });

    // Handle RPC call errors (network, permission, etc.)
    if (error) {
      console.error('Join Event RPC Error:', error);
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' };
    }

    // Handle business logic errors from function
    if (data.status === 'error') {
      return { success: false, message: data.message || 'Başvuru yapılamadı.' };
    }

    // Success - Return queue status
    return {
      success: true,
      queue: data.queue as QueueStatus,
      message: data.message || 'Başvurunuz başarıyla alındı!'
    };

  } catch (err) {
    console.error('Unexpected Error:', err);
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
  }
}

/**
 * Get user's booking for a specific event
 */
export async function getUserBooking(eventId: number): Promise<Booking | null> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user booking:', error);
      return null;
    }

    return data as Booking | null;
  } catch (error) {
    console.warn('Failed to fetch user booking', error);
    return null;
  }
}

/**
 * Cancel booking (user can cancel before cut-off date)
 */
export async function cancelBooking(bookingId: number): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' };
  }

  try {
    // 2. Get booking to check ownership and cut-off date
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, events!inner(cut_off_date)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !booking) {
      return { success: false, message: 'Başvuru bulunamadı.' };
    }

    // 3. Check cut-off date
    const cutOffDate = new Date((booking as any).events.cut_off_date);
    const now = new Date();
    if (now > cutOffDate) {
      return { success: false, message: 'İptal tarihi geçmiş. Başvurunuzu iptal edemezsiniz.' };
    }

    // 4. Update booking status to IPTAL
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ queue_status: 'IPTAL' })
      .eq('id', bookingId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error canceling booking:', updateError);
      return { success: false, message: 'Başvuru iptal edilemedi. Lütfen tekrar deneyin.' };
    }

    // 5. Promote from waitlist if needed (admin should call this, but we can trigger it)
    // This will be handled by admin action

    return { success: true, message: 'Başvurunuz iptal edildi.' };

  } catch (err) {
    console.error('Unexpected Error:', err);
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
  }
}

/**
 * Get booking queue position (for yedek list)
 */
export async function getBookingQueuePosition(eventId: number, userId: string): Promise<number | null> {
  const supabase = createClient();

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_date, queue_status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (!booking || booking.queue_status !== 'YEDEK') {
      return null;
    }

    // Count bookings before this one in yedek list
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('queue_status', 'YEDEK')
      .lt('booking_date', booking.booking_date);

    return (count || 0) + 1; // Position (1-indexed)
  } catch (error) {
    console.error('Error getting queue position:', error);
    return null;
  }
}

