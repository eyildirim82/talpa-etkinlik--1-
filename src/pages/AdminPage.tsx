import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useProfile } from '@/modules/profile';
import {
    AdminLayout,
    AdminTab,
    OverviewPanel,
    EventsPanel,
    TicketsPanel,
    UsersPanel,
} from '@/modules/admin';
import { Loader2, ShieldX, Lock } from 'lucide-react';


// Create local query client for AdminPage - REMOVED, using global client
// const queryClient = new QueryClient();

// SessionStorage key to remember admin was verified
const ADMIN_VERIFIED_KEY = '__admin_verified__'

// Check if admin was previously verified in this session
function wasAdminVerified(): boolean {
    try {
        return sessionStorage.getItem(ADMIN_VERIFIED_KEY) === 'true'
    } catch {
        return false
    }
}

// Mark admin as verified for this session
function setAdminVerified(): void {
    try {
        sessionStorage.setItem(ADMIN_VERIFIED_KEY, 'true')
    } catch {
        // Ignore
    }
}

interface AdminPageProps {
    onBack: () => void;
}

const AdminContent: React.FC<AdminPageProps> = ({ onBack }) => {
    const { user, isLoading } = useProfile();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Track if we've ever successfully loaded admin content
    const hasBeenVerifiedRef = useRef(wasAdminVerified());

    const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';

    const setActiveTab = (tab: AdminTab) => {
        setSearchParams({ tab });
    };

    const isAdmin = user?.is_admin === true;
    
    // Once admin is verified, remember it
    useEffect(() => {
        if (isAdmin && !isLoading) {
            hasBeenVerifiedRef.current = true;
            setAdminVerified();
        }
    }, [isAdmin, isLoading]);

    // CRITICAL FIX: Skip loading state if admin was previously verified
    // This prevents the "page refresh" feeling on alt+tab
    const shouldShowLoading = isLoading && !hasBeenVerifiedRef.current;

    const handleLogout = async () => {
        const { logout } = await import('@/modules/auth');
        await logout();
        window.location.reload();
    };

    if (shouldShowLoading) {
        return (
            <div className="min-h-screen bg-gradient-admin flex items-center justify-center font-sans">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto" />
                    <p className="mt-6 text-text-inverse-muted text-caption uppercase tracking-wider">
                        Yükleniyor...
                    </p>
                </div>
            </div>
        );
    }

    // If we're still loading but admin was verified before, show the admin content
    // with the last known user data (which will be updated once loading completes)
    if (!user && !hasBeenVerifiedRef.current) {
        return (
            <div className="min-h-screen bg-gradient-admin flex items-center justify-center p-6 font-sans">
                <div className="bg-gradient-admin-card border border-brand-gold/20 rounded-3xl p-12 max-w-[420px] w-full text-center">
                    <div className="w-20 h-20 rounded-2xl bg-state-warning/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-state-warning" />
                    </div>
                    <h1 className="text-h2 font-bold text-text-inverse mb-3">
                        Giriş Gerekli
                    </h1>
                    <p className="text-text-inverse-muted mb-8 text-body-sm leading-relaxed">
                        Admin paneline erişmek için giriş yapmanız gerekmektedir.
                    </p>
                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-gradient-gold rounded-xl text-ui-background-dark text-body-sm font-semibold cursor-pointer transition-all duration-normal ease-motion-default hover:-translate-y-0.5 hover:shadow-gold-glow"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    // Only show access denied if admin was never verified AND user is definitely not admin
    if (!isAdmin && !hasBeenVerifiedRef.current && !isLoading) {
        return (
            <div className="min-h-screen bg-gradient-admin flex items-center justify-center p-6 font-sans">
                <div className="bg-gradient-admin-card border border-state-error/20 rounded-3xl p-12 max-w-[420px] w-full text-center">
                    <div className="w-20 h-20 rounded-2xl bg-state-error/10 flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-10 h-10 text-state-error" />
                    </div>
                    <h1 className="text-h2 font-bold text-text-inverse mb-3">
                        Erişim Engellendi
                    </h1>
                    <p className="text-text-inverse-muted mb-8 text-body-sm leading-relaxed">
                        Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekmektedir.
                    </p>
                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-transparent border border-brand-gold/30 rounded-xl text-brand-gold text-body-sm font-semibold cursor-pointer transition-all duration-normal ease-motion-default hover:bg-brand-gold/10 hover:border-brand-gold"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    const renderPanel = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPanel />;
            case 'events':
                return <EventsPanel />;
            case 'tickets':
                return <TicketsPanel />;
            case 'users':
                return <UsersPanel />;
            default:
                return <OverviewPanel />;
        }
    };

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={onBack}
            userName={user?.full_name || 'Admin'}
            onLogout={handleLogout}
        >
            {renderPanel()}
        </AdminLayout>
    );
};


const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    return (
        <AdminContent onBack={onBack} />
    );
};

export default AdminPage;
