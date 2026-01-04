import React from 'react';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    Users,
    LogOut,
    X
} from 'lucide-react';

export type AdminTab = 'overview' | 'events' | 'tickets' | 'users';

interface MenuItem {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'overview', label: 'Genel Bakış', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'events', label: 'Etkinlikler', icon: <Calendar className="w-5 h-5" /> },
    { id: 'tickets', label: 'Biletler', icon: <Ticket className="w-5 h-5" /> },
    { id: 'users', label: 'Üyeler', icon: <Users className="w-5 h-5" /> },
];

interface AdminSidebarProps {
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    userName?: string;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeTab,
    onTabChange,
    userName,
    onLogout,
    isOpen,
    onClose
}) => {
    const handleTabClick = (tabId: AdminTab) => {
        onTabChange(tabId);
        onClose();
    };

    return (
        <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            background: 'linear-gradient(180deg, #0D2137 0%, #0A1929 100%)',
            borderRight: '1px solid rgba(212, 175, 55, 0.15)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column'
        }} className="lg-sidebar">
            {/* Logo */}
            <div style={{
                padding: '2rem',
                borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: '#D4AF37',
                            letterSpacing: '-0.02em',
                            margin: 0
                        }}>TALPA</h1>
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            letterSpacing: '0.2em',
                            color: 'rgba(212, 175, 55, 0.6)',
                            textTransform: 'uppercase'
                        }}>Admin Panel</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'none',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#E5E5E5'
                        }}
                        className="lg-hide"
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem 1.25rem',
                            marginBottom: '0.5rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === item.id
                                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)'
                                : 'transparent',
                            color: activeTab === item.id ? '#D4AF37' : 'rgba(229, 229, 229, 0.7)',
                            fontSize: '0.9rem',
                            fontWeight: activeTab === item.id ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            borderLeft: activeTab === item.id ? '3px solid #D4AF37' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== item.id) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.color = '#E5E5E5';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== item.id) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(229, 229, 229, 0.7)';
                            }
                        }}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User & Logout */}
            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid rgba(212, 175, 55, 0.1)'
            }}>
                {userName && (
                    <div style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                        <span style={{
                            fontSize: '0.65rem',
                            color: 'rgba(229, 229, 229, 0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>Hoş geldin</span>
                        <p style={{
                            margin: '0.25rem 0 0 0',
                            fontWeight: '600',
                            color: '#D4AF37',
                            fontSize: '0.95rem'
                        }}>{userName}</p>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(196, 30, 58, 0.3)',
                        background: 'rgba(196, 30, 58, 0.1)',
                        color: '#C41E3A',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(196, 30, 58, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(196, 30, 58, 0.1)';
                    }}
                >
                    <LogOut style={{ width: '18px', height: '18px' }} />
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
