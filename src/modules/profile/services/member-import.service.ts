/**
 * Member Import Service
 * Handles bulk member import operations from Excel files
 * 
 * @module profile/services
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import * as XLSX from 'xlsx'

/**
 * Member data structure for import
 */
export interface MemberImportData {
    tckn: string
    sicil_no: string
    email: string
    full_name: string
}

/**
 * Import result for a single member
 */
export interface MemberImportResult {
    email: string
    status: 'success' | 'exists' | 'error'
    message?: string
}

/**
 * Batch import result
 */
export interface BatchImportResult {
    success: boolean
    results: MemberImportResult[]
    successCount: number
    errorCount: number
    error?: string
}

/**
 * Parse Excel file and extract member data
 * 
 * @param file - The Excel file to parse
 * @returns Parsed member data array
 */
export async function parseExcelMembers(file: File): Promise<MemberImportData[]> {
    try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Validate and map data
        const mappedData: MemberImportData[] = jsonData.map((row: any) => ({
            tckn: String(row['tckn'] || row['TCKN'] || '').trim(),
            sicil_no: String(row['sicil_no'] || row['SICIL_NO'] || '').trim(),
            email: String(row['email'] || row['EMAIL'] || '').trim(),
            full_name: String(row['full_name'] || row['AD_SOYAD'] || '').trim(),
        })).filter(item => item.email && item.tckn)

        return mappedData
    } catch (err) {
        logger.error('Excel Parse Error:', err)
        throw new Error('Dosya okunurken hata oluştu.')
    }
}

/**
 * Validate member data before import
 * 
 * @param data - The member data to validate
 * @returns Validation result with errors if any
 */
export function validateMemberData(data: MemberImportData[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.length === 0) {
        errors.push('Dosyada geçerli veri bulunamadı. Kolon isimlerini kontrol edin: tckn, sicil_no, email, full_name')
    }

    // Check for duplicate emails
    const emails = data.map(d => d.email.toLowerCase())
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index)
    if (duplicates.length > 0) {
        errors.push(`Tekrarlayan e-posta adresleri: ${[...new Set(duplicates)].join(', ')}`)
    }

    // Validate email format
    const invalidEmails = data.filter(d => !isValidEmail(d.email))
    if (invalidEmails.length > 0) {
        errors.push(`Geçersiz e-posta formatı: ${invalidEmails.map(d => d.email).slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`)
    }

    // Validate TCKN (11 digits)
    const invalidTckn = data.filter(d => d.tckn.length !== 11 || !/^\d+$/.test(d.tckn))
    if (invalidTckn.length > 0) {
        errors.push(`Geçersiz TC Kimlik No (11 haneli olmalı): ${invalidTckn.length} kayıt`)
    }

    return { valid: errors.length === 0, errors }
}

/**
 * Import members via Edge Function
 * 
 * @param members - The member data to import
 * @returns Import results
 */
export async function importMembers(members: MemberImportData[]): Promise<BatchImportResult> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return {
            success: false,
            results: [],
            successCount: 0,
            errorCount: 0,
            error: 'Yetkisiz erişim.'
        }
    }

    try {
        const supabase = createBrowserClient()

        // Call Supabase Edge Function
        const { data: results, error } = await supabase.functions.invoke('import-users', {
            body: { users: members }
        })

        if (error) {
            logger.error('Import Members Edge Function Error:', error)
            return {
                success: false,
                results: [],
                successCount: 0,
                errorCount: members.length,
                error: 'Sunucu hatası: ' + error.message
            }
        }

        // Process results
        const importResults: MemberImportResult[] = Array.isArray(results) 
            ? results.map((res: any) => ({
                email: res.email,
                status: res.status as 'success' | 'exists' | 'error',
                message: res.message
            }))
            : []

        const successCount = importResults.filter(r => r.status === 'success' || r.status === 'exists').length
        const errorCount = importResults.filter(r => r.status === 'error').length

        return {
            success: true,
            results: importResults,
            successCount,
            errorCount
        }
    } catch (err) {
        logger.error('Import Members Error:', err)
        return {
            success: false,
            results: [],
            successCount: 0,
            errorCount: members.length,
            error: 'Beklenmeyen bir hata oluştu.'
        }
    }
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
