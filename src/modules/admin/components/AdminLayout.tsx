import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronRight } from 'lucide-react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { Button } from '@/components/common/Button';

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
        <div className="min-h-screen bg-talpa-bg font-sans text-talpa-text-main flex">
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
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px] transition-all duration-300">

                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="hidden sm:flex items-center text-sm text-gray-500">
                            <span className="hover:text-gray-900 cursor-pointer" onClick={onBack}>Admin</span>
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="font-medium text-gray-900">{tabLabels[activeTab]}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar (Visual Only) */}
                        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
                            <Search className="w-4 h-4 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                            />
                        </div>

                        {/* Notifications */}
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-900 hidden sm:flex"
                        >
                            Ana Sayfaya Dön
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export type { AdminTab } from './AdminSidebar';
export default AdminLayout;
