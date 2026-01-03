import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile } from '../api/profiles';
import { createClient } from '../../utils/supabase/browser';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const useProfile = () => {
    const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createClient();
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
            // Invalidate profile query when auth state changes
            if (session?.user) {
                queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
            } else {
                queryClient.removeQueries({ queryKey: ['profile'] });
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile', sessionUser?.id],
        queryFn: () => getProfile(sessionUser!.id),
        enabled: !!sessionUser?.id,
    });

    return {
        user: profile,
        isLoading: isAuthLoading || (!!sessionUser && isProfileLoading),
        isAuthenticated: !!sessionUser
    };
};
