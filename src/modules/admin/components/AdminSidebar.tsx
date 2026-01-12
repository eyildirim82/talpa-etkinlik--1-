import React from 'react';
import { X, LayoutDashboard, Calendar, Ticket, Users, Gem, LogOut, ChevronRight } from 'lucide-react';

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
        <aside
            className={`
                fixed top-0 left-0 bottom-0 w-60 bg-ui-surface border-r border-ui-border-subtle shrink-0 z-20 flex flex-col transition-transform duration-slow ease-motion-default
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            <div className="flex h-full flex-col py-6 gap-8">
                {/* Logo */}
                <div className="px-6 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 cursor-pointer shrink-0">
                        <Gem className="w-6 h-6" />
                    </div>
                    <span className="text-text-primary font-display font-semibold text-h4">TALPA</span>
                </div>

                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-md hover:bg-ui-background"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 w-full px-4">
                    {MENU_ITEMS.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-slow ease-motion-default group
                                    ${isActive
                                        ? 'text-brand-primary bg-brand-primary/5 font-medium'
                                        : 'text-text-muted hover:text-text-primary hover:bg-ui-background'
                                    }
                                `}
                            >
                                <span className={`shrink-0 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}>
                                    {item.icon}
                                </span>
                                <span className="text-body-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="mt-auto px-4 border-t border-ui-border-subtle pt-4">
                    {userName && (
                        <div className="px-4 py-2 mb-2 text-body-sm text-text-muted truncate">
                            {userName}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-text-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="text-body-sm font-medium">Çıkış Yap</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
