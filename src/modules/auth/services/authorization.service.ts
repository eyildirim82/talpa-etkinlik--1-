import { createBrowserClient } from '@/shared/infrastructure/supabase'

/**
 * Authorization Service
 * Centralized admin check service used by API functions across all modules
 * 
 * @module auth/services
 */

/**
 * Check if the current user has admin privileges
 * Uses RPC function for server-side validation (preferred) with profile fallback
 */
export async function checkAdmin(): Promise<boolean> {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    try {
        // Try RPC first (preferred - server-side check)
        const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
        if (!error && isAdmin != null) return !!isAdmin

        // Fallback to profile check
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single()

        return !!(profile?.is_admin || profile?.role === 'admin')
    } catch (e) {
        console.error('[authorization] Admin check failed:', e)
        return false
    }
}
