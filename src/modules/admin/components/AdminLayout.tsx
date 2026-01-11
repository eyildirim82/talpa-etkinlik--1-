import React, { useState } from 'react';
import { Menu } from 'lucide-react';
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

    // Map tab ID to display label for breadcrumbs
    const tabLabels: Record<AdminTab, string> = {
        overview: 'Genel Bakış',
        events: 'Etkinlikler',
        tickets: 'Bilet Yönetimi',
        users: 'Kullanıcılar'
    };

    return (
        <div className="min-h-screen bg-ui-background text-text-primary font-body antialiased flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <AdminSidebar
                activeTab={activeTab}
                onTabChange={onTabChange}
                userName={userName}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative lg:ml-60">
                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
                        {/* Breadcrumbs and Title */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-text-muted text-caption font-medium uppercase tracking-wider mb-1">
                                    <span className="hover:text-text-primary cursor-pointer" onClick={onBack}>Admin</span>
                                    <span className="material-symbols-outlined text-body-sm">chevron_right</span>
                                    <span className="text-text-primary">{tabLabels[activeTab]}</span>
                                </div>
                                <h1 className="text-h1 md:text-display-2 font-display font-light text-text-primary tracking-tight">
                                    {tabLabels[activeTab]}
                                </h1>
                            </div>
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-text-muted hover:text-text-primary hover:bg-gray-50 rounded-lg"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Page Content */}
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export type { AdminTab } from './AdminSidebar';
export default AdminLayout;
