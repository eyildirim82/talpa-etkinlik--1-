import { createClient } from '../utils/supabase/browser';
import { Request } from '../types';

export async function createEventRequest(eventId: string) {
    const supabase = createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'İşlem için giriş yapmalısınız.' };
    }

    try {
        // 2. Check if request already exists (Client-side double check)
        const { data: existing, error: checkError } = await supabase
            .from('requests')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            return { success: false, message: 'Bu etkinlik için zaten bir talebiniz bulunuyor.' };
        }

        // 3. Insert Request
        const { data, error } = await supabase
            .from('requests')
            .insert({
                user_id: user.id,
                event_id: eventId,
                status: 'pending' // Default per DB, but being explicit
            })
            .select()
            .single();

        if (error) {
            // Handle unique constraint violation just in case race condition
            if (error.code === '23505') {
                return { success: false, message: 'Bu etkinlik için zaten bir talebiniz bulunuyor.' };
            }
            console.error('Request Creation Error:', error);
            return { success: false, message: 'Talep oluşturulamadı. Lütfen tekrar deneyin.' };
        }

        return {
            success: true,
            request: data as Request,
            message: 'Talebiniz başarıyla alındı!'
        };

    } catch (err) {
        console.error('Unexpected Error:', err);
        return { success: false, message: 'Beklenmeyen bir hata oluştu.' };
    }
}

export async function getUserRequest(eventId: string) {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user request:', error);
            return null;
        }

        return data as Request;
    } catch (error) {
        console.warn('Failed to fetch user request', error);
        return null;
    }
}
