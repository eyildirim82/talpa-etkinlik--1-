import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../utils/react-query';
import { useProfile } from '../hooks/useProfile';
import {
    AdminLayout,
    AdminTab,
    OverviewPanel,
    EventsPanel,
    TicketsPanel,
    UsersPanel,
} from '../../components/admin';
import { Loader2, ShieldX, Lock } from 'lucide-react';

interface AdminPageProps {
    onBack: () => void;
}

const AdminContent: React.FC<AdminPageProps> = ({ onBack }) => {
    const { user, isLoading } = useProfile();
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');

    const isAdmin = user?.role === 'admin';

    const handleLogout = async () => {
        const { logout } = await import('../../actions/auth');
        await logout();
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 style={{
                        width: '48px',
                        height: '48px',
                        animation: 'spin 1s linear infinite',
                        color: '#D4AF37'
                    }} />
                    <p style={{
                        marginTop: '1.5rem',
                        color: 'rgba(229, 229, 229, 0.5)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                    }}>Yükleniyor...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(13, 33, 55, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '24px',
                    padding: '3rem 2.5rem',
                    maxWidth: '420px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Lock style={{ width: '40px', height: '40px', color: '#F59E0B' }} />
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#E5E5E5',
                        margin: '0 0 0.75rem 0'
                    }}>Giriş Gerekli</h1>
                    <p style={{
                        color: 'rgba(229, 229, 229, 0.5)',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                    }}>
                        Admin paneline erişmek için giriş yapmanız gerekmektedir.
                    </p>
                    <button
                        onClick={onBack}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#0A1929',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(13, 33, 55, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '24px',
                    padding: '3rem 2.5rem',
                    maxWidth: '420px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <ShieldX style={{ width: '40px', height: '40px', color: '#EF4444' }} />
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#E5E5E5',
                        margin: '0 0 0.75rem 0'
                    }}>Erişim Engellendi</h1>
                    <p style={{
                        color: 'rgba(229, 229, 229, 0.5)',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                    }}>
                        Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekmektedir.
                    </p>
                    <button
                        onClick={onBack}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'transparent',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '12px',
                            color: '#D4AF37',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                            e.currentTarget.style.borderColor = '#D4AF37';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                        }}
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
            userName={user.full_name}
            onLogout={handleLogout}
        >
            {renderPanel()}
        </AdminLayout>
    );
};

const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AdminContent onBack={onBack} />
        </QueryClientProvider>
    );
};

export default AdminPage;
