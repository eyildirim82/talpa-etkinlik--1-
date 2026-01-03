import { createClient } from '../../utils/supabase/browser';
import { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
};
