import React, { useState } from 'react';
import {
    Users,
    Search,
    Shield,
    ShieldCheck,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { useAdminUsers, useUpdateUserRole } from '@/modules/admin';

const selectStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    color: '#E5E5E5',
    fontSize: '0.85rem',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
    minWidth: '150px'
};

import { MemberImport } from './MemberImport';

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

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', color: '#D4AF37' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#E5E5E5', margin: 0 }}>Üyeler</h2>
                    <p style={{ color: 'rgba(229, 229, 229, 0.5)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Kayıtlı üyeleri görüntüleyin ve yönetin</p>
                </div>
                <button
                    onClick={() => setShowImport(!showImport)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: showImport ? 'rgba(255,255,255,0.1)' : 'rgba(13, 148, 136, 0.2)',
                        border: showImport ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(13, 148, 136, 0.5)',
                        color: showImport ? '#E5E5E5' : '#2dd4bf',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    {showImport ? 'İptal' : 'Excel ile Üye Ekle'}
                </button>
            </div>

            {/* Import Section */}
            {showImport && (
                <div style={{ marginBottom: '2rem' }}>
                    <MemberImport />
                </div>
            )}

            {/* Filters */}
            <div style={{
                background: 'rgba(13, 33, 55, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                {/* Search */}
                <div style={{ flex: '1 1 250px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(229, 229, 229, 0.3)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="İsim, sicil no veya telefon ara..."
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.75rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: '10px',
                            color: '#E5E5E5',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Role Filter */}
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
                    <option value="">Tüm Roller</option>
                    <option value="admin">Admin</option>
                    <option value="member">Üye</option>
                </select>
            </div>

            {/* Users Table */}
            <div style={{
                background: 'rgba(13, 33, 55, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '1.5rem'
            }}>
                {filteredUsers.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <Users style={{ width: '48px', height: '48px', color: 'rgba(212, 175, 55, 0.3)', margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#E5E5E5', margin: 0 }}>Üye bulunamadı</h3>
                        <p style={{ color: 'rgba(229, 229, 229, 0.4)', marginTop: '0.5rem' }}>Arama kriterlerinize uygun üye yok</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                    {['Üye', 'TALPA Sicil No', 'Telefon', 'Rol', 'Kayıt Tarihi', 'İşlem'].map((h) => (
                                        <th key={h} style={{ padding: '1rem 1.25rem', textAlign: h === 'İşlem' ? 'right' : 'left', fontSize: '0.7rem', fontWeight: '600', color: 'rgba(212, 175, 55, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        style={{ borderBottom: index < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: user.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {user.role === 'admin'
                                                        ? <ShieldCheck style={{ width: '18px', height: '18px', color: '#D4AF37' }} />
                                                        : <Users style={{ width: '18px', height: '18px', color: 'rgba(229, 229, 229, 0.4)' }} />
                                                    }
                                                </div>
                                                <span style={{ fontWeight: '500', color: '#E5E5E5', fontSize: '0.9rem' }}>{user.full_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'rgba(229, 229, 229, 0.6)' }}>{user.talpa_sicil_no || '-'}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'rgba(229, 229, 229, 0.5)' }}>{user.phone || '-'}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                background: user.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                                                color: user.role === 'admin' ? '#D4AF37' : 'rgba(229, 229, 229, 0.6)'
                                            }}>
                                                {user.role === 'admin' ? <ShieldCheck style={{ width: '12px', height: '12px' }} /> : <Shield style={{ width: '12px', height: '12px' }} />}
                                                {user.role === 'admin' ? 'Admin' : 'Üye'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(229, 229, 229, 0.4)' }}>
                                                {new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setRoleChangeConfirm({
                                                    userId: user.id,
                                                    userName: user.full_name,
                                                    newRole: user.role === 'admin' ? 'member' : 'admin',
                                                })}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: user.role === 'admin' ? 'rgba(229, 229, 229, 0.5)' : '#D4AF37',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500',
                                                    cursor: 'pointer'
                                                }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#D4AF37', margin: 0 }}>{users?.filter((u) => u.role === 'admin').length || 0}</p>
                    <p style={{ fontSize: '0.75rem', color: '#D4AF37', marginTop: '0.25rem', opacity: 0.8 }}>Admin</p>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'rgba(229, 229, 229, 0.7)', margin: 0 }}>{users?.filter((u) => u.role === 'member').length || 0}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.5)', marginTop: '0.25rem' }}>Üye</p>
                </div>
            </div>

            {/* Role Change Confirmation */}
            {roleChangeConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0D2137 0%, #0A1929 100%)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D4AF37', marginBottom: '1rem' }}>
                            <AlertCircle style={{ width: '24px', height: '24px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Rol Değiştir</h3>
                        </div>
                        <p style={{ color: 'rgba(229, 229, 229, 0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <strong style={{ color: '#E5E5E5' }}>{roleChangeConfirm.userName}</strong> kullanıcısını{' '}
                            <strong style={{ color: '#D4AF37' }}>{roleChangeConfirm.newRole === 'admin' ? 'Admin' : 'Üye'}</strong> yapmak istediğinizden emin misiniz?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setRoleChangeConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(229, 229, 229, 0.2)', borderRadius: '10px', color: 'rgba(229, 229, 229, 0.7)', cursor: 'pointer' }}>Vazgeç</button>
                            <button onClick={handleRoleChange} disabled={updateUserRole.isPending} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)', border: 'none', borderRadius: '10px', color: '#0A1929', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {updateUserRole.isPending && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default UsersPanel;
