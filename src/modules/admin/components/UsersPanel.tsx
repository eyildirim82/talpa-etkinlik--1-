import React, { useState, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { useAdminUsers, useUpdateUserRole } from '@/modules/admin';
import { MemberImport } from './MemberImport';

// SessionStorage key to remember if panel was loaded
const USERS_PANEL_LOADED_KEY = '__users_panel_loaded__'

function wasUsersPanelLoaded(): boolean {
    try {
        return sessionStorage.getItem(USERS_PANEL_LOADED_KEY) === 'true'
    } catch {
        return false
    }
}

function setUsersPanelLoaded(): void {
    try {
        sessionStorage.setItem(USERS_PANEL_LOADED_KEY, 'true')
    } catch {
        // Ignore
    }
}

export const UsersPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [showImport, setShowImport] = useState(false);
    const [roleChangeConfirm, setRoleChangeConfirm] = useState<{
        userId: string;
        userName: string;
        newRole: 'admin' | 'member';
    } | null>(null);

    const { data: users, isLoading } = useAdminUsers();
    const updateUserRole = useUpdateUserRole();
    const hasBeenLoadedRef = useRef(wasUsersPanelLoaded());

    // Once data is loaded, remember it
    React.useEffect(() => {
        if (users && !isLoading) {
            hasBeenLoadedRef.current = true;
            setUsersPanelLoaded();
        }
    }, [users, isLoading]);

    const handleRoleChange = async () => {
        if (!roleChangeConfirm) return;
        try {
            await updateUserRole.mutateAsync({
                userId: roleChangeConfirm.userId,
                role: roleChangeConfirm.newRole,
            });
            setRoleChangeConfirm(null);
        } catch (error) {
            logger.error('Error updating user role:', error);
        }
    };

    const filteredUsers = users?.filter((user) => {
        const matchesSearch =
            !searchQuery ||
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.talpa_sicil_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone?.includes(searchQuery);
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    }) || [];

    // Only show loading if panel was never loaded before
    const shouldShowLoading = isLoading && !hasBeenLoadedRef.current && !users;

    if (shouldShowLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-h1 md:text-display-2 font-display font-light text-text-primary tracking-tight">
                        Üyeler
                    </h1>
                </div>
                <button
                    onClick={() => setShowImport(!showImport)}
                    className={`flex items-center gap-2 cursor-pointer h-10 px-5 text-sm font-medium rounded-full transition-all duration-300 shadow-subtle hover:shadow-lg ${
                        showImport
                            ? 'bg-ui-surface border border-ui-border-subtle text-text-primary hover:bg-ui-background'
                            : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">{showImport ? 'close' : 'upload_file'}</span>
                    <span>{showImport ? 'İptal' : 'Excel ile Üye Ekle'}</span>
                </button>
            </div>

            {/* Import Section */}
            {showImport && (
                <div className="mb-8">
                    <MemberImport />
                </div>
            )}

            {/* Filters */}
            <div className="p-5 bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[250px] relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors text-[20px]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="İsim, sicil no veya telefon ara..."
                        className="w-full h-10 pl-10 pr-4 bg-transparent border-b border-ui-border-subtle focus:border-brand-primary outline-none text-sm text-text-primary placeholder-text-muted/60 font-medium transition-all"
                    />
                </div>

                {/* Role Filter */}
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-10 px-4 bg-transparent border-b border-ui-border-subtle focus:border-brand-primary outline-none text-sm text-text-primary font-medium cursor-pointer min-w-[150px]"
                >
                    <option value="">Tüm Roller</option>
                    <option value="admin">Admin</option>
                    <option value="member">Üye</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-ui-surface rounded-3xl border border-ui-border-subtle shadow-subtle overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="p-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-text-muted/30 mb-4 block">group</span>
                        <h3 className="text-h3 font-semibold text-text-primary mb-1">Üye bulunamadı</h3>
                        <p className="text-body-sm text-text-muted">Arama kriterlerinize uygun üye yok</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-ui-border-subtle">
                                    {['Üye', 'TALPA Sicil No', 'Telefon', 'Rol', 'Kayıt Tarihi', 'İşlem'].map((h) => (
                                        <th key={h} className={`py-6 px-8 text-xs font-semibold uppercase tracking-widest text-text-muted ${h === 'İşlem' ? 'text-right' : ''}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border-subtle">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-ui-background transition-colors">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                    user.role === 'admin' ? 'bg-brand-primary/10' : 'bg-ui-background'
                                                }`}>
                                                    <span className={`material-symbols-outlined text-lg ${
                                                        user.role === 'admin' ? 'text-brand-primary' : 'text-text-muted/40'
                                                    }`}>
                                                        {user.role === 'admin' ? 'admin_panel_settings' : 'person'}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-text-primary text-sm">{user.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-xs font-mono text-text-muted">{user.talpa_sicil_no || '-'}</span>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-sm text-text-muted">{user.phone || '-'}</span>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin'
                                                    ? 'bg-brand-primary/10 text-brand-primary'
                                                    : 'bg-ui-background text-text-secondary'
                                            }`}>
                                                <span className={`material-symbols-outlined text-xs ${
                                                    user.role === 'admin' ? 'text-brand-primary' : 'text-text-muted'
                                                }`}>
                                                    {user.role === 'admin' ? 'admin_panel_settings' : 'shield'}
                                                </span>
                                                {user.role === 'admin' ? 'Admin' : 'Üye'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-xs text-text-muted">
                                                {new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <button
                                                onClick={() => setRoleChangeConfirm({
                                                    userId: user.id,
                                                    userName: user.full_name,
                                                    newRole: user.role === 'admin' ? 'member' : 'admin',
                                                })}
                                                className={`text-xs font-medium transition-colors ${
                                                    user.role === 'admin'
                                                        ? 'text-text-muted hover:text-text-primary'
                                                        : 'text-brand-primary hover:text-brand-primary/80'
                                                }`}
                                            >
                                                {user.role === 'admin' ? 'Üye Yap' : 'Admin Yap'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle text-center group hover:border-brand-primary/20 transition-colors">
                    <p className="text-h1 font-display font-medium text-brand-primary mb-1">{users?.filter((u) => u.role === 'admin').length || 0}</p>
                    <p className="text-xs text-text-muted font-medium">Admin</p>
                </div>
                <div className="p-5 bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle text-center group hover:border-brand-primary/20 transition-colors">
                    <p className="text-h1 font-display font-medium text-text-primary mb-1">{users?.filter((u) => u.role === 'member').length || 0}</p>
                    <p className="text-xs text-text-muted font-medium">Üye</p>
                </div>
            </div>

            {/* Role Change Confirmation */}
            {roleChangeConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-ui-surface rounded-3xl border border-ui-border-subtle shadow-lg p-8 max-w-md w-full">
                        <div className="flex items-center gap-3 text-brand-primary mb-4">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="text-h3 font-semibold text-text-primary">Rol Değiştir</h3>
                        </div>
                        <p className="text-sm text-text-muted mb-6">
                            <strong className="text-text-primary">{roleChangeConfirm.userName}</strong> kullanıcısını{' '}
                            <strong className="text-brand-primary">{roleChangeConfirm.newRole === 'admin' ? 'Admin' : 'Üye'}</strong> yapmak istediğinizden emin misiniz?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRoleChangeConfirm(null)}
                                className="flex-1 px-4 py-2 bg-transparent border border-ui-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:bg-ui-background transition-colors text-sm font-medium"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleRoleChange}
                                disabled={updateUserRole.isPending}
                                className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {updateUserRole.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPanel;
