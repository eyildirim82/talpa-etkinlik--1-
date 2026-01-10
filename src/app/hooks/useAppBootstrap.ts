import { useEffect, useState } from 'react';
import { EventData, User } from '@/types/index';
import { createBrowserClient } from '@/shared/infrastructure/supabase';

// Track last visibility change to ignore SIGNED_IN events triggered by tab focus
let lastVisibilityChangeTime = 0
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastVisibilityChangeTime = Date.now()
    }
  })
}

export interface AppBootstrapState {
    loading: boolean;
    user: User | null;
    events: EventData[];
}

export function useAppBootstrap(): AppBootstrapState {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [events, setEvents] = useState<EventData[]>([]);

    useEffect(() => {
        const loadData = async () => {

            try {
                const supabase = createBrowserClient();

                const fetchUser = async (sessionUser: any) => {
                    if (sessionUser) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', sessionUser.id)
                            .single();
                        if (profile) setUser(profile);
                    } else {
                        setUser(null);
                    }
                };

                // Initial load
                const { data: { user: authUser } } = await supabase.auth.getUser();

                await fetchUser(authUser);

                // Listen for changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    // Check if this is a spurious SIGNED_IN triggered by tab focus
                    const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeTime
                    const isSpuriousSignIn = event === 'SIGNED_IN' && timeSinceVisibilityChange < 1000
                    
                    // Ignore spurious SIGNED_IN events triggered by tab focus
                    if (isSpuriousSignIn) {
                        return;
                    }

                    if (session?.user) {
                        if (event === 'SIGNED_IN') {
                            fetchUser(session.user);
                        }
                        // We explicitly IGNORE 'TOKEN_REFRESHED' and 'USER_UPDATED' to prevent
                        // the "reload" effect when switching tabs (Alt+Tab).
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                    }
                });

                // Fetch active event from view
                const { data: activeEvent, error: eventError } = await supabase
                    .from('active_event_view')
                    .select('*')
                    .maybeSingle();

                if (eventError) console.error('Event fetch error:', eventError);

                if (activeEvent) {
                    setEvents([activeEvent]);
                } else {
                    setEvents([]);
                }

                return () => subscription.unsubscribe();

            } catch (error) {
                console.error('[useAppBootstrap] Error loading data:', error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { loading, user, events };
}
