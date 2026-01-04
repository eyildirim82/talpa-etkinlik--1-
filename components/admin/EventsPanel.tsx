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
    AlertTriangle,
} from 'lucide-react';
import {
    useAdminEvents,
    useSetActiveEvent,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    type AdminEvent,
} from '@/modules/admin';
import { supabase } from '@/src/lib/supabase';

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

// Tailwind input classes
const inputClasses = "w-full px-4 py-3 bg-white/5 border border-gold/20 rounded-lg text-light text-sm outline-none transition-colors focus:border-gold/50 placeholder:text-light/30";
const labelClasses = "block text-xs text-light/60 mb-2 uppercase tracking-wider";

export const EventsPanel: React.FC = () => {
    const { data: events, isLoading } = useAdminEvents();
    const setActiveEvent = useSetActiveEvent();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>(initialFormData);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [activeConfirm, setActiveConfirm] = useState<number | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Find current active event for confirmation message
    const currentActiveEvent = events?.find(e => e.status === 'ACTIVE');
    const eventToActivate = events?.find(e => e.id === activeConfirm);

    const handleOpenCreate = () => {
        setEditingEvent(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBanner(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-banners')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('event-banners')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, banner_image: publicUrl }));

        } catch (error) {
            console.error('Upload error:', error);
            alert('Yükleme hatası oluştu. Lütfen "event-banners" bucket\'ının oluşturulduğundan emin olun.');
        } finally {
            setUploadingBanner(false);
        }
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
            setActiveConfirm(null);
        } catch (error) {
            console.error('Error setting active event:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-light">Etkinlikler</h2>
                    <p className="text-light/50 mt-2 text-sm">Etkinlikleri yönetin ve düzenleyin</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-gold to-gold-dark border-none rounded-lg text-dark text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/30"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Etkinlik
                </button>
            </div>

            {/* Events List */}
            {events?.length === 0 ? (
                <div className="bg-primary/60 border border-gold/10 rounded-2xl p-16 text-center">
                    <Calendar className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-light">Henüz etkinlik yok</h3>
                    <p className="text-light/40 mt-2">İlk etkinliğinizi oluşturun</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {events?.map((event) => (
                        <div
                            key={event.id}
                            className={`bg-gradient-to-br from-primary/80 to-dark/90 rounded-2xl overflow-hidden relative ${event.status === 'ACTIVE' ? 'border border-gold/50' : 'border border-gold/10'
                                }`}
                        >
                            {/* Active indicator bar */}
                            {event.status === 'ACTIVE' && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light" />
                            )}

                            <div className="p-6">
                                <div className="flex gap-6 items-start flex-wrap">
                                    {/* Image */}
                                    {event.image_url && (
                                        <div className="w-[120px] h-[80px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-lg font-semibold text-light">{event.title}</h3>
                                            {event.status === 'ACTIVE' && (
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gold/20 text-gold uppercase tracking-wider">
                                                    Aktif
                                                </span>
                                            )}
                                            {event.status === 'DRAFT' && (
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-400 uppercase tracking-wider">
                                                    Taslak
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-5 mt-3">
                                            <span className="flex items-center gap-1.5 text-xs text-light/50">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(event.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-light/50">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {event.location}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-light/50">
                                                <Users className="w-3.5 h-3.5" />
                                                Asil: {event.asil_count || 0} / {event.quota_asil || 0} | Yedek: {event.yedek_count || 0} / {event.quota_yedek || 0}
                                            </span>
                                        </div>

                                        <p className="text-xl font-bold text-gold mt-3">
                                            {event.price.toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        {event.status !== 'ACTIVE' ? (
                                            <button
                                                onClick={() => setActiveConfirm(event.id)}
                                                disabled={setActiveEvent.isPending}
                                                className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                                                title="Aktif Yap"
                                            >
                                                <Power className="w-[18px] h-[18px]" />
                                            </button>
                                        ) : (
                                            <div className="p-2.5 text-light/20">
                                                <PowerOff className="w-[18px] h-[18px]" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleOpenEdit(event)}
                                            className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 cursor-pointer hover:bg-blue-500/20 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="w-[18px] h-[18px]" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(event.id)}
                                            className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 cursor-pointer hover:bg-red-500/20 transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-gold to-emerald-500 rounded-r-sm"
                                    style={{
                                        width: `${Math.min((((event.asil_count || 0) + (event.yedek_count || 0)) / ((event.quota_asil || 0) + (event.quota_yedek || 0))) * 100, 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-gradient-to-br from-primary to-dark border border-gold/20 rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-auto">
                        <div className="px-6 py-5 border-b border-gold/10 flex items-center justify-between sticky top-0 bg-primary z-10">
                            <h3 className="text-lg font-semibold text-light">
                                {editingEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="bg-transparent border-none text-light/50 cursor-pointer p-1 hover:text-light">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className={labelClasses}>Etkinlik Adı</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClasses} placeholder="Yılbaşı Galası 2025" />
                            </div>

                            <div className="mb-4">
                                <label className={labelClasses}>Açıklama</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputClasses} resize-y min-h-[80px]`} placeholder="Detaylar..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClasses}>Tarih</label>
                                    <input type="datetime-local" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Konum (URL)</label>
                                    <input type="url" required value={formData.location_url} onChange={(e) => setFormData({ ...formData, location_url: e.target.value })} className={inputClasses} placeholder="https://maps.google.com/..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClasses}>Fiyat (₺)</label>
                                    <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Durum</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as EventFormData['status'] })} className={inputClasses}>
                                        <option value="DRAFT">Taslak</option>
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="ARCHIVED">Arşiv</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClasses}>Asil Kota</label>
                                    <input type="number" required min="1" value={formData.quota_asil} onChange={(e) => setFormData({ ...formData, quota_asil: parseInt(e.target.value) || 0 })} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Yedek Kota</label>
                                    <input type="number" required min="0" value={formData.quota_yedek} onChange={(e) => setFormData({ ...formData, quota_yedek: parseInt(e.target.value) || 0 })} className={inputClasses} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className={labelClasses}>Son İptal Tarihi</label>
                                <input type="datetime-local" required value={formData.cut_off_date} onChange={(e) => setFormData({ ...formData, cut_off_date: e.target.value })} className={inputClasses} />
                            </div>

                            <div className="mb-6">
                                <label className={labelClasses}>Afiş Görseli</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        value={formData.banner_image}
                                        onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                                        className={`${inputClasses} flex-1`}
                                        placeholder="https://..."
                                    />
                                    <label className="px-4 py-3 bg-white/5 border border-gold/20 rounded-lg text-gold cursor-pointer text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
                                        {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        <span>Yükle</span>
                                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                    </label>
                                </div>
                                {formData.banner_image && (
                                    <div className="mt-2 h-[100px] rounded-lg overflow-hidden border border-white/10">
                                        <img src={formData.banner_image} alt="Preview" className="w-full h-full object-contain bg-black" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-transparent border border-light/20 rounded-lg text-light/70 text-sm font-medium cursor-pointer hover:border-light/40 transition-colors">
                                    İptal
                                </button>
                                <button type="submit" disabled={createEvent.isPending || updateEvent.isPending} className="flex-1 py-3.5 bg-gradient-to-br from-gold to-gold-dark border-none rounded-lg text-dark text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70">
                                    {(createEvent.isPending || updateEvent.isPending) ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" />}
                                    {editingEvent ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Set Active Confirmation Modal */}
            {activeConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-gradient-to-br from-primary to-dark border border-amber-500/20 rounded-2xl p-8 max-w-[450px] w-full">
                        <div className="flex items-center gap-3 text-amber-500 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Etkinliği Aktif Yap</h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-light/70 text-sm">
                                <strong className="text-light">"{eventToActivate?.title}"</strong> etkinliğini aktif yapmak istediğinize emin misiniz?
                            </p>

                            {currentActiveEvent && currentActiveEvent.id !== activeConfirm && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                    <p className="text-amber-400 text-sm">
                                        ⚠️ Şu an aktif olan <strong>"{currentActiveEvent.title}"</strong> etkinliği pasife çekilecektir.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setActiveConfirm(null)} className="flex-1 py-3 bg-transparent border border-light/20 rounded-lg text-light/70 cursor-pointer hover:border-light/40 transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={() => handleSetActive(activeConfirm)}
                                disabled={setActiveEvent.isPending}
                                className="flex-1 py-3 bg-emerald-500 border-none rounded-lg text-white font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-70"
                            >
                                {setActiveEvent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Aktif Yap
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-gradient-to-br from-primary to-dark border border-red-500/20 rounded-2xl p-8 max-w-[400px] w-full">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Etkinliği Sil</h3>
                        </div>
                        <p className="text-light/60 mb-6 text-sm">Bu işlem geri alınamaz. Devam etmek istiyor musunuz?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-transparent border border-light/20 rounded-lg text-light/70 cursor-pointer hover:border-light/40 transition-colors">
                                İptal
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteEvent.isPending} className="flex-1 py-3 bg-red-500 border-none rounded-lg text-white font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-70">
                                {deleteEvent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPanel;
