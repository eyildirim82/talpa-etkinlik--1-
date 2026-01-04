import React, { useState } from 'react';
import {
    Menu,
    ChevronLeft
} from 'lucide-react';
import { AdminSidebar, AdminTab } from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    onBack: () => void;
    userName?: string;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    onBack,
    userName,
    onLogout,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0A1929',
            display: 'flex',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        zIndex: 40
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <AdminSidebar
                activeTab={activeTab}
                onTabChange={onTabChange}
                userName={userName}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content */}
            <div style={{
                flex: 1,
                marginLeft: '280px',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0
            }} className="lg-main">
                {/* Top bar */}
                <header style={{
                    background: 'rgba(10, 25, 41, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                }}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{
                            display: 'none',
                            padding: '0.5rem',
                            marginRight: '1rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#E5E5E5'
                        }}
                        className="lg-show"
                    >
                        <Menu style={{ width: '24px', height: '24px' }} />
                    </button>

                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: '8px',
                            color: 'rgba(229, 229, 229, 0.7)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#D4AF37';
                            e.currentTarget.style.color = '#D4AF37';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                            e.currentTarget.style.color = 'rgba(229, 229, 229, 0.7)';
                        }}
                    >
                        <ChevronLeft style={{ width: '16px', height: '16px' }} />
                        <span>Ana Sayfa</span>
                    </button>

                    <div style={{ marginLeft: 'auto' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'rgba(229, 229, 229, 0.5)',
                            letterSpacing: '0.05em'
                        }}>
                            {new Date().toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main style={{
                    flex: 1,
                    padding: '2rem',
                    overflowY: 'auto'
                }}>
                    {children}
                </main>
            </div>

            {/* Desktop sidebar visibility */}
            <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar {
            transform: translateX(0) !important;
          }
          .lg-main {
            margin-left: 280px !important;
          }
          .lg-hide {
            display: none !important;
          }
          .lg-show {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .lg-main {
            margin-left: 0 !important;
          }
          .lg-show {
            display: flex !important;
          }
          .lg-hide {
            display: flex !important;
          }
        }
      `}</style>
        </div>
    );
};

// Re-export AdminTab type for consumers
export type { AdminTab } from './AdminSidebar';
export default AdminLayout;
