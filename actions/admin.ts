import { createClient } from '../utils/supabase/browser'
import * as XLSX from 'xlsx';

// Helper to check admin role (updated for is_admin field)
async function checkAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  // Check both is_admin and role for backward compatibility
  return !!(profile?.is_admin || profile?.role === 'admin')
}

export async function createEvent(eventData: {
  title: string
  description?: string
  event_date: string
  location_url?: string
  price: number
  quota_asil: number
  quota_yedek: number
  cut_off_date: string
  banner_image?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  const {
    title,
    description,
    event_date,
    location_url,
    price,
    quota_asil,
    quota_yedek,
    cut_off_date,
    banner_image,
    status = 'DRAFT'
  } = eventData

  const eventDate = new Date(event_date).toISOString()
  const cutOffDateISO = cut_off_date ? new Date(cut_off_date).toISOString() : eventDate

  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      event_date: eventDate,
      location_url: location_url,
      price,
      quota_asil,
      quota_yedek,
      cut_off_date: cutOffDateISO,
      banner_image: banner_image,
      status
    })

  if (error) {
    console.error('Create Event Error:', error)
    return { success: false, message: 'Etkinlik oluşturulamadı.' }
  }

  return { success: true, message: 'Etkinlik başarıyla oluşturuldu.' }
}

export async function setActiveEvent(eventId: number) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  const { data, error } = await supabase.rpc('set_active_event', {
    p_event_id: eventId
  })

  if (error) {
    console.error('Set Active RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (!data.success) {
    return { success: false, message: data.error || 'Etkinlik aktif edilemedi.' }
  }

  return { success: true, message: data.message }
}

export async function getEventStats(eventId: number) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  // Get event with booking counts
  const { data: event } = await supabase
    .from('events')
    .select('quota_asil, quota_yedek, price')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { success: false, message: 'Etkinlik bulunamadı.' }
  }

  // Get booking counts
  const { count: asilCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('queue_status', 'ASIL')

  const { count: yedekCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('queue_status', 'YEDEK')

  const { count: paidCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('payment_status', 'PAID')

  return {
    success: true,
    stats: {
      quota_asil: event.quota_asil,
      quota_yedek: event.quota_yedek,
      asil_count: asilCount || 0,
      yedek_count: yedekCount || 0,
      paid_count: paidCount || 0,
      revenue: (paidCount || 0) * event.price
    }
  }
}

/**
 * Assign ticket from pool to booking (admin only)
 */
export async function assignTicket(bookingId: number): Promise<{ success: boolean; message: string }> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  const { data, error } = await supabase.rpc('assign_ticket', {
    booking_id_param: bookingId
  })

  if (error) {
    console.error('Assign Ticket RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (data.status === 'error') {
    return { success: false, message: data.message || 'Bilet atanamadı.' }
  }

  // Helper to fetch details and send email
  const sendTicketEmail = async () => {
    try {
      // Fetch booking with profile, event and ticket details
      // Note: RPC assigned the ticket, so we need to find the ticket assigned to this booking
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
                *,
                profiles(email, full_name),
                events(title),
                ticket_pool(file_path, file_name)
            `)
        .eq('id', bookingId)
        .single();

      const booking = bookingData as any;
      // The ticket_pool relation might assume one ticket. 
      // Based on schema, booking has one ticket? No, ticket_pool has assigned_to (user_id) or similar? 
      // Actually ticket_pool has 'assigned_to' (booking_id likely in new schema? or user_id)
      // Let's check ticket_pool regarding this booking. 
      // Schema says: ticket_pool.assigned_to -> profile_id? 
      // Wait, migration check: 
      // ticket_pool: assigned_to UUID REFERENCES profiles(id)
      // So we can find ticket by user_id of the booking? 
      // For now let's try to find the ticket assigned to this user for this event.

      if (booking && booking.profiles?.email) {
        const { data: ticket } = await supabase
          .from('ticket_pool')
          .select('file_path')
          .eq('assigned_to', booking.user_id)
          .eq('event_id', booking.event_id)
          .single();

        if (ticket) {
          const { data: { publicUrl } } = supabase.storage
            .from('tickets')
            .getPublicUrl(ticket.file_path);

          await supabase.functions.invoke('send-email', {
            body: {
              type: 'TICKET_ASSIGNED',
              to: [booking.profiles.email],
              payload: {
                eventTitle: booking.events?.title,
                userName: booking.profiles.full_name,
                pdfUrl: publicUrl
              }
            }
          });
        }
      }
    } catch (err) {
      console.error('Email trigger error:', err);
    }
  };

  // Trigger email asynchronously
  sendTicketEmail();

  return { success: true, message: data.message || 'Bilet başarıyla atandı.' }
}

/**
 * Promote first yedek to asil (admin only)
 */
export async function promoteFromWaitlist(eventId: number): Promise<{ success: boolean; message: string }> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  const { data, error } = await supabase.rpc('promote_from_waitlist', {
    event_id_param: eventId
  })

  if (error) {
    console.error('Promote Waitlist RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (data.status === 'error') {
    return { success: false, message: data.message || 'Yedekten asile geçiş yapılamadı.' }
  }

  return { success: true, message: data.message || 'Yedek listeden asile çıkarıldı.' }
}

/**
 * Cancel a booking (admin only)
 * Sets status to IPTAL and triggers promote_from_waitlist
 */
export async function cancelBooking(bookingId: number, eventId: number): Promise<{ success: boolean; message: string }> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  // 1. Update status to IPTAL
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ queue_status: 'IPTAL', payment_status: 'WAITING' }) // Reset payment status too? Maybe.
    .eq('id', bookingId)

  if (updateError) {
    console.error('Cancel Booking Error:', updateError)
    return { success: false, message: 'İptal işlemi başarısız.' }
  }

  // 2. Trigger promote_from_waitlist
  const promoteResult = await promoteFromWaitlist(eventId)

  if (promoteResult.success) {
    return { success: true, message: `Başvuru iptal edildi. ${promoteResult.message}` }
  }

  return { success: true, message: 'Başvuru iptal edildi. Yedek listeden geçiş yapılamadı veya liste boş.' }
}

/**
 * Export bookings to Excel format (for accounting)
 */


export async function exportBookingsToExcel(eventId: number): Promise<Blob | null> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return null
  }
  const supabase = createClient()

  // Get bookings with user profiles
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      queue_status,
      payment_status,
      profiles!inner(full_name, email, tckn, sicil_no)
    `)
    .eq('event_id', eventId)
    .order('booking_date', { ascending: true })

  if (error || !bookings) {
    console.error('Error fetching bookings:', error)
    return null
  }

  // Prepare data for Excel
  const rows = bookings.map((booking, index) => {
    const profile = (booking as any).profiles
    return {
      'Sıra': index + 1,
      'Ad Soyad': profile.full_name || '',
      'TC Kimlik No': profile.tckn || '',
      'Dernek Sicil No': profile.sicil_no || '',
      'E-posta': profile.email || '',
      'Başvuru Tarihi': new Date(booking.booking_date).toLocaleString('tr-TR'),
      'Durum': booking.queue_status === 'ASIL' ? 'ASİL' : (booking.queue_status === 'YEDEK' ? 'YEDEK' : booking.queue_status),
      'Ödeme Durumu': booking.payment_status === 'PAID' ? 'ÖDENDİ' : 'BEKLİYOR'
    }
  })

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Başvurular");

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Upload ticket pool ZIP file and extract PDFs
 * Note: This is a simplified version. Full implementation would require:
 * - JSZip library for client-side extraction
 * - Or Supabase Edge Function for server-side processing
 */
export async function uploadTicketPool(
  eventId: number,
  zipFile: File
): Promise<{ success: boolean; count: number; message: string }> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, count: 0, message: 'Yetkisiz erişim.' }
  }
  const supabase = createClient()

  // This is a placeholder - full implementation would:
  // 1. Extract ZIP file (client-side with JSZip or server-side with Edge Function)
  // 2. Upload each PDF to Supabase Storage (tickets bucket)
  // 3. Insert records into ticket_pool table

  // For now, return error indicating this needs implementation
  return {
    success: false,
    count: 0,
    message: 'Bilet havuzu yükleme henüz implement edilmedi. JSZip veya Edge Function gerekli.'
  }
}
