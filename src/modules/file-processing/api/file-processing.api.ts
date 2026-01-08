import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/shared/services/authz'
import { logger } from '@/shared/utils/logger'
import type { FileProcessingResponse } from '../types/file-processing.types'

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
      logger.error('Process ZIP Error:', error)
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
    logger.error('Unexpected Error:', err)
    return { success: false, count: 0, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

/**
 * Upload and process ticket pool ZIP file
 * @param eventId - Event ID to associate tickets with
 * @param file - ZIP file to upload
 * @param onProgress - Progress callback (current, total)
 */
export async function uploadTicketPool(
  eventId: number,
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<FileProcessingResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, count: 0, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  try {
    // Generate unique filename
    const fileName = `${eventId}/${Date.now()}_${file.name}`

    // Upload to temp-uploads bucket
    onProgress?.(1, 3)
    const { error: uploadError } = await supabase.storage
      .from('temp-uploads')
      .upload(fileName, file)

    if (uploadError) {
      logger.error('Upload Error:', uploadError)
      return { success: false, count: 0, message: 'Dosya yüklenemedi.' }
    }

    onProgress?.(2, 3)

    // Call edge function to process ZIP
    const result = await processTicketZip(eventId, fileName)

    onProgress?.(3, 3)

    return result
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { success: false, count: 0, message: 'Beklenmeyen bir hata oluştu.' }
  }
}
