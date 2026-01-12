/**
 * Centralized error handling utilities
 * Standard response format for all API operations
 */

export interface StandardError {
    success: false
    message: string
    code?: string
}

export interface StandardSuccess<T = unknown> {
    success: true
    message: string
    data?: T
}

export type StandardResponse<T = unknown> = StandardSuccess<T> | StandardError

export function createError(message: string, code?: string): StandardError {
    return { success: false, message, code }
}

export function createSuccess<T>(message: string, data?: T): StandardSuccess<T> {
    return { success: true, message, data }
}

export function handleSupabaseError(error: any, defaultMsg: string): StandardError {
    if (error?.code === 'PGRST116') {
        return createError('Kayıt bulunamadı.', 'NOT_FOUND')
    }
    if (error?.code === '23503') {
        return createError('İlişkili kayıt bulunamadı.', 'FOREIGN_KEY_VIOLATION')
    }
    if (error?.code === '23505') {
        return createError('Bu kayıt zaten mevcut.', 'UNIQUE_VIOLATION')
    }
    if (error?.message) {
        return createError(error.message, error.code || 'SUPABASE_ERROR')
    }
    return createError(defaultMsg, 'UNKNOWN_ERROR')
}
