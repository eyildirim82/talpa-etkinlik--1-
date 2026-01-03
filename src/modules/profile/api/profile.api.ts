import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { Profile } from '../types/profile.types'

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }
    return data
}

