import { createBrowserClient } from '@/shared/infrastructure/supabase'
import * as XLSX from 'xlsx'
import type { AdminResponse } from '../types/admin.types'
import { assignTicket } from '@/modules/ticket'
import { promoteFromWaitlist } from '../utils/admin.utils'

// Helper to check admin role
async function checkAdmin(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  return !!(profile?.is_admin || profile?.role === 'admin')
}

/**
 * Cancel a booking (admin only)
 */
export async function cancelBooking(bookingId: number, eventId: number): Promise<AdminResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  // 1. Update status to IPTAL
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ queue_status: 'IPTAL', payment_status: 'WAITING' })
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
 * Export bookings to Excel format
 */
export async function exportBookingsToExcel(eventId: number): Promise<Blob | null> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return null
  }
  const supabase = createBrowserClient()

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
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Başvurular')

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

