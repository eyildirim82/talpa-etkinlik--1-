/**
 * Booking Export Service
 * Handles export operations for bookings (Excel, PDF, etc.)
 * 
 * @module booking/services
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import * as XLSX from 'xlsx'

/**
 * Export result type
 */
export interface ExportResult {
    success: boolean
    data?: Blob
    error?: string
}

/**
 * Export bookings to Excel format
 * 
 * @param eventId - The event ID to export bookings for
 * @returns Export result with Blob on success
 */
export async function exportBookingsToExcel(eventId: number): Promise<ExportResult> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { success: false, error: 'Yetkisiz erişim.' }
    }

    try {
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
            logger.error('Error fetching bookings for export:', error)
            return { success: false, error: 'Başvurular alınamadı.' }
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
                'Durum': formatQueueStatus(booking.queue_status),
                'Ödeme Durumu': formatPaymentStatus(booking.payment_status)
            }
        })

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Başvurular')

        // Set column widths
        worksheet['!cols'] = [
            { wch: 6 },   // Sıra
            { wch: 25 },  // Ad Soyad
            { wch: 15 },  // TC Kimlik No
            { wch: 15 },  // Dernek Sicil No
            { wch: 30 },  // E-posta
            { wch: 20 },  // Başvuru Tarihi
            { wch: 10 },  // Durum
            { wch: 12 },  // Ödeme Durumu
        ]

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        return { success: true, data: blob }
    } catch (err) {
        logger.error('Unexpected Export Error:', err)
        return { success: false, error: 'Excel oluşturulurken hata oluştu.' }
    }
}

/**
 * Format queue status for display
 */
function formatQueueStatus(status: string): string {
    switch (status) {
        case 'ASIL': return 'ASİL'
        case 'YEDEK': return 'YEDEK'
        case 'IPTAL': return 'İPTAL'
        default: return status
    }
}

/**
 * Format payment status for display
 */
function formatPaymentStatus(status: string): string {
    switch (status) {
        case 'PAID': return 'ÖDENDİ'
        case 'WAITING': return 'BEKLİYOR'
        default: return status
    }
}

/**
 * Download exported file
 * Helper function to trigger file download in browser
 * 
 * @param blob - The file blob
 * @param filename - The filename for download
 */
export function downloadExportedFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}
