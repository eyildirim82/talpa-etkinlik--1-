import React from 'react';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    Users,
    LogOut,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom'; // If needed, or button

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
                fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-talpa-red rounded-lg flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">TALPA</h1>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Admin</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="ml-auto lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }
                            `}
                        >
                            {/* Icon styling based on state */}
                            <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {userName || 'Admin User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            Yönetici
                        </p>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
