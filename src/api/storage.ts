import { supabase } from '../lib/supabase';
import JSZip from 'jszip';

/**
 * Upload ticket pool ZIP file
 * Extracts PDFs and uploads them to Supabase Storage and `ticket_pool` table
 */
export async function uploadTicketPool(
    eventId: number,
    zipFile: File,
    onProgress?: (count: number, total: number) => void
): Promise<{ success: boolean; count: number; message: string }> {
    try {
        // 1. Validate ZIP
        if (zipFile.type !== 'application/zip' && !zipFile.name.endsWith('.zip')) {
            return { success: false, count: 0, message: 'Lütfen geçerli bir ZIP dosyası yükleyin.' };
        }

        // 2. Load ZIP
        const zip = await JSZip.loadAsync(zipFile);
        const pdfFiles: { name: string; data: Blob }[] = [];

        // 3. Extract PDFs
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith('.pdf')) {
                // Flatten structure: use only filename
                const fileName = zipEntry.name.split('/').pop();
                if (fileName && !fileName.startsWith('._')) { // Ignore macOS hidden files
                    pdfFiles.push({ name: fileName, data: new Blob() }); // Placeholder
                }
            }
        });

        // 4. Process files
        let uploadedCount = 0;
        const totalFiles = pdfFiles.length;

        if (totalFiles === 0) {
            return { success: false, count: 0, message: 'ZIP dosyası içinde PDF bulunamadı.' };
        }

        // We need to re-iterate to get content async
        const filePromises = Object.keys(zip.files).map(async (key) => {
            const zipEntry = zip.files[key];
            if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith('.pdf') && !zipEntry.name.split('/').pop()?.startsWith('._')) {
                const fileName = zipEntry.name.split('/').pop()!;
                const content = await zipEntry.async('blob');

                // Upload to Storage
                const filePath = `event-${eventId}/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from('tickets')
                    .upload(filePath, content, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`Upload error for ${fileName}:`, uploadError);
                    return false;
                }

                // Insert into Database
                const { error: dbError } = await supabase
                    .from('ticket_pool')
                    .insert({
                        event_id: eventId,
                        file_name: fileName,
                        file_path: filePath,
                        is_assigned: false
                    });

                if (dbError) {
                    // Ignore duplicate key errors (if file already exists)
                    if (dbError.code !== '23505') {
                        console.error(`DB error for ${fileName}:`, dbError);
                        return false;
                    }
                }

                uploadedCount++;
                if (onProgress) onProgress(uploadedCount, totalFiles);
                return true;
            }
            return false;
        });

        await Promise.all(filePromises);

        return {
            success: true,
            count: uploadedCount,
            message: `${uploadedCount} adet bilet başarıyla yüklendi.`
        };

    } catch (error) {
        console.error('Upload Ticket Pool Error:', error);
        return { success: false, count: 0, message: 'Dosya işlenirken bir hata oluştu.' };
    }
}

/**
 * Upload event banner image
 */
export async function uploadBanner(
    eventId: number,
    imageFile: File
): Promise<{ success: boolean; url?: string; message: string }> {
    try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `banner-${eventId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('event-banners')
            .upload(filePath, imageFile, {
                upsert: true
            });

        if (uploadError) {
            console.error('Upload banner error:', uploadError);
            return { success: false, message: 'Görsel yüklenemedi.' };
        }

        const { data } = supabase.storage
            .from('event-banners')
            .getPublicUrl(filePath);

        return {
            success: true,
            url: data.publicUrl,
            message: 'Afiş başarıyla yüklendi.'
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
    }
}
