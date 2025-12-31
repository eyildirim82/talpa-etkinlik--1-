import { createClient } from '../utils/supabase/browser'

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

  // Convert to CSV format (simple implementation, can be enhanced with Excel library)
  const headers = ['Sıra', 'Ad Soyad', 'TC Kimlik No', 'Sicil No', 'E-posta', 'Başvuru Tarihi', 'Durum', 'Ödeme Durumu']
  const rows = bookings.map((booking, index) => {
    const profile = (booking as any).profiles
    return [
      index + 1,
      profile.full_name || '',
      profile.tckn || '',
      profile.sicil_no || '',
      profile.email || '',
      new Date(booking.booking_date).toLocaleString('tr-TR'),
      booking.queue_status,
      booking.payment_status
    ]
  })

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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
