import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
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
      return { success: false, count: 0, message: `ZIP işleme hatası: ${error.message || 'Bilinmeyen hata'}` }
    }

    // Handle standardized response format from Edge Function
    if (!data || !data.success) {
      const errorMessage = data?.error || data?.errors?.join(', ') || 'İşlem başarısız oldu.'
      const processedCount = data?.processedCount || 0
      const total = data?.total || 0
      
      if (processedCount > 0) {
        return { 
          success: false, 
          count: processedCount, 
          message: `${processedCount}/${total} bilet işlendi, ancak hatalar oluştu: ${errorMessage}` 
        }
      }
      
      return { success: false, count: 0, message: errorMessage }
    }

    const processedCount = data.processedCount || 0
    const total = data.total || 0
    
    return {
      success: true,
      count: processedCount,
      message: `${processedCount}${total > processedCount ? `/${total}` : ''} bilet başarıyla işlendi.`
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
