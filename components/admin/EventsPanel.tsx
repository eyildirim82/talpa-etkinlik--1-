import React, { useState } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Power,
    PowerOff,
    Calendar,
    MapPin,
    Users,
    Loader2,
    X,
    Save,
    AlertCircle,
} from 'lucide-react';
import {
    useAdminEvents,
    useSetActiveEvent,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    AdminEvent,
} from '../../src/hooks/useAdmin';

interface EventFormData {
    title: string;
    description: string;
    location_url: string;
    event_date: string;
    price: number;
    quota_asil: number;
    quota_yedek: number;
    cut_off_date: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    banner_image: string;
}

const initialFormData: EventFormData = {
    title: '',
    description: '',
    location_url: '',
    event_date: '',
    price: 0,
    quota_asil: 50,
    quota_yedek: 30,
    cut_off_date: '',
    status: 'DRAFT',
    banner_image: '',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    color: '#E5E5E5',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s'
};

export const EventsPanel: React.FC = () => {
    const { data: events, isLoading } = useAdminEvents();
    const setActiveEvent = useSetActiveEvent();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>(initialFormData);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleOpenCreate = () => {
        setEditingEvent(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleOpenEdit = (event: AdminEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            location_url: event.location_url || event.location || '',
            event_date: event.event_date.slice(0, 16),
            price: event.price,
            quota_asil: event.quota_asil || 50,
            quota_yedek: event.quota_yedek || 30,
            cut_off_date: event.cut_off_date ? new Date(event.cut_off_date).toISOString().slice(0, 16) : '',
            status: event.status || 'DRAFT',
            banner_image: event.banner_image || event.image_url || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const eventData = {
            ...formData,
            // Convert datetime-local to ISO string
            event_date: new Date(formData.event_date).toISOString(),
            cut_off_date: formData.cut_off_date ? new Date(formData.cut_off_date).toISOString() : new Date(formData.event_date).toISOString(),
        };

        try {
            if (editingEvent) {
                await updateEvent.mutateAsync({ id: editingEvent.id, ...eventData });
            } else {
                await createEvent.mutateAsync(eventData);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDelete = async (eventId: number) => {
        try {
            await deleteEvent.mutateAsync(eventId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleSetActive = async (eventId: number) => {
        try {
            await setActiveEvent.mutateAsync(eventId);
        } catch (error) {
            console.error('Error setting active event:', error);
        }
    };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#E5E5E5', margin: 0 }}>Etkinlikler</h2>
                    <p style={{ color: 'rgba(229, 229, 229, 0.5)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Etkinlikleri yönetin ve düzenleyin</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#0A1929',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Plus style={{ width: '18px', height: '18px' }} />
                    Yeni Etkinlik
                </button>
            </div>

            {/* Events List */}
            {events?.length === 0 ? (
                <div style={{
                    background: 'rgba(13, 33, 55, 0.6)',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    borderRadius: '16px',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}>
                    <Calendar style={{ width: '48px', height: '48px', color: 'rgba(212, 175, 55, 0.3)', margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#E5E5E5', margin: 0 }}>Henüz etkinlik yok</h3>
                    <p style={{ color: 'rgba(229, 229, 229, 0.4)', marginTop: '0.5rem' }}>İlk etkinliğinizi oluşturun</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {events?.map((event) => (
                        <div
                            key={event.id}
                            style={{
                                background: 'linear-gradient(135deg, rgba(13, 33, 55, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)',
                                border: event.status === 'ACTIVE'
                                    ? '1px solid rgba(212, 175, 55, 0.5)'
                                    : '1px solid rgba(212, 175, 55, 0.1)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {event.status === 'ACTIVE' && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #D4AF37 0%, #F5D76E 100%)'
                                }} />
                            )}

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    {/* Image */}
                                    {event.image_url && (
                                        <div style={{
                                            width: '120px',
                                            height: '80px',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: 'rgba(255,255,255,0.05)'
                                        }}>
                                            <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#E5E5E5', margin: 0 }}>{event.title}</h3>
                            {event.status === 'ACTIVE' && (
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    color: '#D4AF37',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>Aktif</span>
                            )}
                            {event.status === 'DRAFT' && (
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    background: 'rgba(156, 163, 175, 0.2)',
                                    color: '#9CA3AF',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>Taslak</span>
                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(229, 229, 229, 0.5)' }}>
                                                <Calendar style={{ width: '14px', height: '14px' }} />
                                                {new Date(event.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(229, 229, 229, 0.5)' }}>
                                                <MapPin style={{ width: '14px', height: '14px' }} />
                                                {event.location}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(229, 229, 229, 0.5)' }}>
                                                <Users style={{ width: '14px', height: '14px' }} />
                                                Asil: {event.asil_count || 0} / {event.quota_asil || 0} | Yedek: {event.yedek_count || 0} / {event.quota_yedek || 0}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#D4AF37', marginTop: '0.75rem' }}>
                                            {event.price.toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        {event.status !== 'ACTIVE' ? (
                                            <button
                                                onClick={() => handleSetActive(event.id)}
                                                disabled={setActiveEvent.isPending}
                                                style={{
                                                    padding: '0.625rem',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                    borderRadius: '10px',
                                                    color: '#10B981',
                                                    cursor: 'pointer'
                                                }}
                                                title="Aktif Yap"
                                            >
                                                <Power style={{ width: '18px', height: '18px' }} />
                                            </button>
                                        ) : (
                                            <div style={{ padding: '0.625rem', color: 'rgba(229, 229, 229, 0.2)' }}>
                                                <PowerOff style={{ width: '18px', height: '18px' }} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleOpenEdit(event)}
                                            style={{
                                                padding: '0.625rem',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                borderRadius: '10px',
                                                color: '#3B82F6',
                                                cursor: 'pointer'
                                            }}
                                            title="Düzenle"
                                        >
                                            <Edit2 style={{ width: '18px', height: '18px' }} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(event.id)}
                                            style={{
                                                padding: '0.625rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: '10px',
                                                color: '#EF4444',
                                                cursor: 'pointer'
                                            }}
                                            title="Sil"
                                        >
                                            <Trash2 style={{ width: '18px', height: '18px' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min((((event.asil_count || 0) + (event.yedek_count || 0)) / ((event.quota_asil || 0) + (event.quota_yedek || 0))) * 100, 100)}%`,
                                    background: 'linear-gradient(90deg, #D4AF37 0%, #10B981 100%)',
                                    borderRadius: '0 2px 2px 0'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D2137 0%, #0A1929 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'sticky',
                            top: 0,
                            background: '#0D2137',
                            zIndex: 10
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#E5E5E5', margin: 0 }}>
                                {editingEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(229, 229, 229, 0.5)', cursor: 'pointer', padding: '0.25rem' }}>
                                <X style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Etkinlik Adı</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={inputStyle} placeholder="Yılbaşı Galası 2025" />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Açıklama</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} placeholder="Detaylar..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tarih</label>
                                    <input type="datetime-local" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Konum (URL)</label>
                                    <input type="url" required value={formData.location_url} onChange={(e) => setFormData({ ...formData, location_url: e.target.value })} style={inputStyle} placeholder="https://maps.google.com/..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fiyat (₺)</label>
                                    <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Durum</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} style={inputStyle}>
                                        <option value="DRAFT">Taslak</option>
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="ARCHIVED">Arşiv</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asil Kota</label>
                                    <input type="number" required min="1" value={formData.quota_asil} onChange={(e) => setFormData({ ...formData, quota_asil: parseInt(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yedek Kota</label>
                                    <input type="number" required min="0" value={formData.quota_yedek} onChange={(e) => setFormData({ ...formData, quota_yedek: parseInt(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Son İptal Tarihi</label>
                                <input type="datetime-local" required value={formData.cut_off_date} onChange={(e) => setFormData({ ...formData, cut_off_date: e.target.value })} style={inputStyle} />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(229, 229, 229, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Afiş Görseli URL</label>
                                <input type="url" value={formData.banner_image} onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })} style={inputStyle} placeholder="https://..." />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(229, 229, 229, 0.2)',
                                    borderRadius: '10px',
                                    color: 'rgba(229, 229, 229, 0.7)',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}>İptal</button>
                                <button type="submit" disabled={createEvent.isPending || updateEvent.isPending} style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#0A1929',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: (createEvent.isPending || updateEvent.isPending) ? 0.7 : 1
                                }}>
                                    {(createEvent.isPending || updateEvent.isPending) ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '18px', height: '18px' }} />}
                                    {editingEvent ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0D2137 0%, #0A1929 100%)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', marginBottom: '1rem' }}>
                            <AlertCircle style={{ width: '24px', height: '24px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Etkinliği Sil</h3>
                        </div>
                        <p style={{ color: 'rgba(229, 229, 229, 0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Bu işlem geri alınamaz. Devam etmek istiyor musunuz?</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(229, 229, 229, 0.2)', borderRadius: '10px', color: 'rgba(229, 229, 229, 0.7)', cursor: 'pointer' }}>İptal</button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteEvent.isPending} style={{ flex: 1, padding: '0.75rem', background: '#EF4444', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {deleteEvent.isPending && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default EventsPanel;
