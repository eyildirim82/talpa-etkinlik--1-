/**
 * Event Storage Service
 * Handles file upload operations for events (banners, images)
 * 
 * @module event/services
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'

/**
 * Upload result type
 */
export interface UploadResult {
    success: boolean
    url?: string
    error?: string
}

/**
 * Upload event banner image to Supabase Storage
 * 
 * @param file - The image file to upload
 * @returns Upload result with public URL on success
 */
export async function uploadEventBanner(file: File): Promise<UploadResult> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { success: false, error: 'Yetkisiz erişim.' }
    }

    try {
        const supabase = createBrowserClient()

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = fileName

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('event-banners')
            .upload(filePath, file)

        if (uploadError) {
            logger.error('Banner Upload Error:', uploadError)
            return {
                success: false,
                error: 'Yükleme hatası oluştu. Lütfen "event-banners" bucket\'ının oluşturulduğundan emin olun.'
            }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('event-banners')
            .getPublicUrl(filePath)

        return { success: true, url: publicUrl }
    } catch (err) {
        logger.error('Unexpected Banner Upload Error:', err)
        return { success: false, error: 'Beklenmeyen bir hata oluştu.' }
    }
}

/**
 * Delete event banner from Supabase Storage
 * 
 * @param url - The public URL of the banner to delete
 * @returns Success status
 */
export async function deleteEventBanner(url: string): Promise<boolean> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return false
    }

    try {
        const supabase = createBrowserClient()

        // Extract file path from URL
        const urlParts = url.split('/event-banners/')
        if (urlParts.length < 2) {
            logger.error('Invalid banner URL:', url)
            return false
        }

        const filePath = urlParts[1]

        const { error } = await supabase.storage
            .from('event-banners')
            .remove([filePath])

        if (error) {
            logger.error('Banner Delete Error:', error)
            return false
        }

        return true
    } catch (err) {
        logger.error('Unexpected Banner Delete Error:', err)
        return false
    }
}
