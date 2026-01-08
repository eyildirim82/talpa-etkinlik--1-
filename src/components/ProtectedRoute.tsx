import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { useAdminCheck } from '@/shared/hooks/useAdminCheck';
import type { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    requireAdmin?: boolean;
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requireAdmin = false,
    redirectTo 
}) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const location = useLocation();
    const supabase = createBrowserClient();
    const { isAdmin, isLoading: isAdminLoading, error: adminError } = useAdminCheck();

    useEffect(() => {
        let isMounted = true;

        async function checkAuth() {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    throw sessionError;
                }

                if (isMounted) {
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Authentication check failed'));
                    setLoading(false);
                }
            }
        }

        checkAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) {
                setUser(session?.user ?? null);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    // Show loading state while checking auth or admin status
    if (loading || (requireAdmin && isAdminLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-8 h-8 border-3 border-talpa-primary/30 border-t-talpa-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // Show error state if there's an error
    if (error || adminError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Bir hata oluştu</p>
                    <p className="text-sm text-gray-600">
                        {error?.message || adminError?.message || 'Bilinmeyen hata'}
                    </p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        const redirectPath = redirectTo || '/login';
        const returnUrl = location.pathname !== '/' ? `?next=${encodeURIComponent(location.pathname)}` : '';
        return <Navigate to={`${redirectPath}${returnUrl}`} replace />;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
        // Redirect non-admin users to home
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
