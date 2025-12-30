import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/profiles';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const useProfile = () => {
    const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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
