import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type ActiveEvent = Database['public']['Views']['active_event_view']['Row'];

export const getActiveEvent = async (): Promise<ActiveEvent | null> => {
    const { data, error } = await supabase
        .from('active_event_view')
        .select('*')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data;
};
