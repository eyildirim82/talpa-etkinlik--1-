import React, { useState } from 'react';
import {
    Ticket,
    Search,
    Filter,
    X as XIcon,
    Loader2,
    QrCode,
    AlertCircle,
} from 'lucide-react';
import { useAdminTickets, useAdminEvents, useCancelTicket } from '../../src/hooks/useAdmin';

const selectStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    color: '#E5E5E5',
    fontSize: '0.85rem',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer'
};

export const TicketsPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState<{ qr: string; name: string } | null>(null);

    const { data: tickets, isLoading: ticketsLoading } = useAdminTickets(selectedEventId || undefined);
    const { data: events } = useAdminEvents();
    const cancelTicket = useCancelTicket();

    const handleCancel = async (ticketId: string) => {
        try {
            await cancelTicket.mutateAsync(ticketId);
            setCancelConfirm(null);
        } catch (error) {
            console.error('Error cancelling ticket:', error);
        }
    };

    const filteredTickets = tickets?.filter((ticket) => {
        const matchesSearch =
            !searchQuery ||
            ticket.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.qr_code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    if (ticketsLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', color: '#D4AF37' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#E5E5E5', margin: 0 }}>Biletler</h2>
                <p style={{ color: 'rgba(229, 229, 229, 0.5)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Satılan biletleri görüntüleyin ve yönetin</p>
            </div>

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
                        placeholder="İsim veya QR kodu ara..."
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

                {/* Event Filter */}
                <div style={{ position: 'relative' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(229, 229, 229, 0.3)', pointerEvents: 'none' }} />
                    <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ ...selectStyle, paddingLeft: '2.5rem', minWidth: '180px' }}>
                        <option value="">Tüm Etkinlikler</option>
                        {events?.map((event) => (
                            <option key={event.id} value={event.id}>{event.title}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: '140px' }}>
                    <option value="">Tüm Durumlar</option>
                    <option value="paid">Ödendi</option>
                    <option value="pending">Beklemede</option>
                    <option value="cancelled">İptal</option>
                </select>
            </div>

            {/* Tickets Table */}
            <div style={{
                background: 'rgba(13, 33, 55, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '1.5rem'
            }}>
                {filteredTickets.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <Ticket style={{ width: '48px', height: '48px', color: 'rgba(212, 175, 55, 0.3)', margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#E5E5E5', margin: 0 }}>Bilet bulunamadı</h3>
                        <p style={{ color: 'rgba(229, 229, 229, 0.4)', marginTop: '0.5rem' }}>Arama kriterlerinize uygun bilet yok</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                    {['Kullanıcı', 'Etkinlik', 'QR Kod', 'Durum', 'Tarih', 'İşlem'].map((h) => (
                                        <th key={h} style={{ padding: '1rem 1.25rem', textAlign: h === 'İşlem' ? 'right' : 'left', fontSize: '0.7rem', fontWeight: '600', color: 'rgba(212, 175, 55, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map((ticket, index) => (
                                    <tr
                                        key={ticket.id}
                                        style={{ borderBottom: index < filteredTickets.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontWeight: '500', color: '#E5E5E5', fontSize: '0.9rem' }}>{ticket.user_name}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'rgba(229, 229, 229, 0.6)' }}>{ticket.event_title}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <button
                                                onClick={() => setShowQRModal({ qr: ticket.qr_code, name: ticket.user_name || '' })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#D4AF37',
                                                    fontSize: '0.8rem',
                                                    fontFamily: 'monospace',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <QrCode style={{ width: '14px', height: '14px' }} />
                                                {ticket.qr_code}
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                background: ticket.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : ticket.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: ticket.status === 'paid' ? '#10B981' : ticket.status === 'pending' ? '#F59E0B' : '#EF4444'
                                            }}>
                                                {ticket.status === 'paid' ? 'Ödendi' : ticket.status === 'pending' ? 'Beklemede' : 'İptal'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(229, 229, 229, 0.4)' }}>
                                                {new Date(ticket.purchase_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                            {ticket.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => setCancelConfirm(ticket.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#EF4444',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '500',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    İptal Et
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Ödendi', count: tickets?.filter((t) => t.status === 'paid').length || 0, color: '#10B981' },
                    { label: 'Beklemede', count: tickets?.filter((t) => t.status === 'pending').length || 0, color: '#F59E0B' },
                    { label: 'İptal', count: tickets?.filter((t) => t.status === 'cancelled').length || 0, color: '#EF4444' },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        background: `${stat.color}10`,
                        border: `1px solid ${stat.color}20`,
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color, margin: 0 }}>{stat.count}</p>
                        <p style={{ fontSize: '0.75rem', color: stat.color, marginTop: '0.25rem', opacity: 0.8 }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Cancel Confirmation */}
            {cancelConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0D2137 0%, #0A1929 100%)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', marginBottom: '1rem' }}>
                            <AlertCircle style={{ width: '24px', height: '24px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Bileti İptal Et</h3>
                        </div>
                        <p style={{ color: 'rgba(229, 229, 229, 0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Bu bileti iptal etmek istediğinizden emin misiniz?</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setCancelConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(229, 229, 229, 0.2)', borderRadius: '10px', color: 'rgba(229, 229, 229, 0.7)', cursor: 'pointer' }}>Vazgeç</button>
                            <button onClick={() => handleCancel(cancelConfirm)} disabled={cancelTicket.isPending} style={{ flex: 1, padding: '0.75rem', background: '#EF4444', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {cancelTicket.isPending && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                İptal Et
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {showQRModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0D2137 0%, #0A1929 100%)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '20px', padding: '2rem', maxWidth: '350px', width: '100%', textAlign: 'center', position: 'relative' }}>
                        <button onClick={() => setShowQRModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(229, 229, 229, 0.5)', cursor: 'pointer' }}>
                            <XIcon style={{ width: '20px', height: '20px' }} />
                        </button>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2.5rem', marginBottom: '1.25rem' }}>
                            <QrCode style={{ width: '100px', height: '100px', color: '#D4AF37' }} />
                        </div>
                        <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: '700', color: '#D4AF37', margin: 0 }}>{showQRModal.qr}</p>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(229, 229, 229, 0.5)', marginTop: '0.5rem' }}>{showQRModal.name}</p>
                        <button onClick={() => setShowQRModal(null)} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '10px', color: 'rgba(229, 229, 229, 0.7)', cursor: 'pointer' }}>Kapat</button>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default TicketsPanel;
