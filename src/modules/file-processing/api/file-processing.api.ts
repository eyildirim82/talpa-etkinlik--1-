import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { FileProcessingResponse } from '../types/file-processing.types'

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
 * Process ZIP file containing tickets
 */
export async function processTicketZip(eventId: number, filePath: string): Promise<FileProcessingResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, count: 0, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase.functions.invoke('process-zip', {
      body: {
        eventId,
        filePath
      }
    })

    if (error) {
      console.error('Process ZIP Error:', error)
      return { success: false, count: 0, message: 'ZIP işleme hatası.' }
    }

    if (!data.success) {
      return { success: false, count: 0, message: data.error || 'İşlem başarısız oldu.' }
    }

    return {
      success: true,
      count: data.processedCount || 0,
      message: `${data.processedCount || 0} bilet başarıyla işlendi.`
    }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { success: false, count: 0, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

