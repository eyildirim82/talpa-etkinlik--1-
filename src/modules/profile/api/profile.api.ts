import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { logger } from '@/shared/utils/logger'
import type { Profile } from '../types/profile.types'

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        logger.error('Error fetching profile:', error)
        return null
    }
    return data
}

