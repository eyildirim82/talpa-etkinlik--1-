import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/shared/infrastructure/supabase';

interface UseAdminCheckResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check if current user is admin
 * Uses RPC function for server-side validation (secure)
 * Caches result to avoid unnecessary API calls
 */
export function useAdminCheck(): UseAdminCheckResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        // Try RPC function first (server-side, RLS-safe)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('get_my_admin_status');

        if (!rpcError && rpcResult !== null && rpcResult !== undefined) {
          if (isMounted) {
            setIsAdmin(!!rpcResult);
            setIsLoading(false);
          }
          return;
        }

        // Fallback to direct profile query if RPC fails
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw new Error(`Failed to check admin status: ${profileError.message}`);
        }

        // Check both is_admin and role for backward compatibility
        const adminStatus = !!(profile?.is_admin || profile?.role === 'admin');

        if (isMounted) {
          setIsAdmin(adminStatus);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error checking admin status'));
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    checkAdminStatus();

    // Listen for auth state changes
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, error };
}
