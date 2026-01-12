/**
 * Profile Admin API
 * Admin-only operations for user/profile management
 * 
 * @module profile/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import type { Profile, ProfileUpdate } from '../types/profile.types'

/**
 * Admin user type with role information
 */
export interface AdminUser extends Profile {
    role: 'admin' | 'member' | null
}

/**
 * Response type for profile admin operations
 */
export interface ProfileAdminResponse {
    success: boolean
    message: string
}

/**
 * Get all users for admin dashboard
 */
export async function getAllUsersAdmin(): Promise<AdminUser[]> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return []
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        logger.error('Get All Users Admin Error:', error)
        throw error
    }

    return (data || []) as AdminUser[]
}

/**
 * Update user role (admin only)
 */
export async function updateUserRoleAdmin(userId: string, role: 'admin' | 'member'): Promise<AdminUser> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        throw new Error('Yetkisiz erişim.')
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        logger.error('Update User Role Admin Error:', error)
        throw error
    }

    return data as AdminUser
}

/**
 * Get user by ID (admin only)
 */
export async function getUserByIdAdmin(userId: string): Promise<AdminUser | null> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return null
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        logger.error('Get User By ID Admin Error:', error)
        throw error
    }

    return data as AdminUser
}

/**
 * Search users by name, email, or sicil no (admin only)
 */
export async function searchUsersAdmin(query: string): Promise<AdminUser[]> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return []
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,talpa_sicil_no.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        logger.error('Search Users Admin Error:', error)
        throw error
    }

    return (data || []) as AdminUser[]
}
