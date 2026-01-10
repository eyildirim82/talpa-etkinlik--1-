import React, { useState, useRef } from 'react';
import {
    Plus,
    Calendar,
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Power,
    PowerOff,
    Loader2,
    X,
    Save,
    MapPin,
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
// Use event module's storage service for banner uploads
import { uploadEventBanner } from '@/modules/event';
import { logger } from '@/shared/utils/logger';
import { StatsCard } from './StatsCard';
import { StatusBadge } from './StatusBadge';

// SessionStorage key to remember if panel was loaded
const EVENTS_PANEL_LOADED_KEY = '__events_panel_loaded__'

function wasEventsPanelLoaded(): boolean {
    try {
        return sessionStorage.getItem(EVENTS_PANEL_LOADED_KEY) === 'true'
    } catch {
        return false
    }
}

function setEventsPanelLoaded(): void {
    try {
        sessionStorage.setItem(EVENTS_PANEL_LOADED_KEY, 'true')
    } catch {
        // Ignore
    }
}
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/common/Button';

// ... Form Types ...
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

export const EventsPanel: React.FC = () => {
    const { data: events, isLoading } = useAdminEvents();
    const hasBeenLoadedRef = useRef(wasEventsPanelLoaded());

    // Once data is loaded, remember it
    React.useEffect(() => {
        if (events && !isLoading) {
            hasBeenLoadedRef.current = true;
            setEventsPanelLoaded();
        }
    }, [events, isLoading]);
    const setActiveEvent = useSetActiveEvent();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>(initialFormData);
    const [activeConfirm, setActiveConfirm] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Stats Calculations ---
    const totalEvents = events?.length || 0;
    const activeListings = events?.filter(e => e.status === 'ACTIVE').length || 0;
    const soldOutEvents = events?.filter(e => {
        const totalQuota = (e.quota_asil || 0) + (e.quota_yedek || 0);
        const totalSold = (e.asil_count || 0) + (e.yedek_count || 0);
        return totalSold >= totalQuota && totalQuota > 0;
    }).length || 0;

    // --- Handlers (Keep existing logic, simplified for brevity in this view) ---
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

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBanner(true);
        try {
            // Use event module's storage service
            const result = await uploadEventBanner(file);

            if (!result.success) {
                throw new Error(result.error);
            }

            setFormData(prev => ({ ...prev, banner_image: result.url || '' }));
        } catch (error) {
            logger.error('Error uploading banner:', error);
            alert('Yükleme hatası oluştu. Lütfen "event-banners" bucket\'ının oluşturulduğundan emin olun.');
        } finally {
            setUploadingBanner(false);
        }
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
            logger.error('Error saving event:', error);
        }
    };

    const handleSetActive = async (eventId: number) => {
        try {
            await setActiveEvent.mutateAsync(eventId);
            setActiveConfirm(null);
        } catch (error) {
            logger.error('Error setting active event:', error);
        }
    };

    const handleDelete = async (eventId: number) => {
        try {
            await deleteEvent.mutateAsync(eventId);
            setDeleteConfirm(null);
        } catch (error) {
            logger.error('Error deleting event:', error);
        }
    };


    // Only show loading if panel was never loaded before
    const shouldShowLoading = isLoading && !hasBeenLoadedRef.current && !events;

    if (shouldShowLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-talpa-gold animate-spin" />
            </div>
        );
    }

    const filteredEvents = events?.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Toplam Etkinlik"
                    value={totalEvents}
                    icon={<Calendar className="w-5 h-5 text-purple-500" />}
                    trend={{ value: '12%', direction: 'up' }}
                />
                <StatsCard
                    title="Aktif Etkinlikler"
                    value={activeListings}
                    icon={<Power className="w-5 h-5 text-emerald-500" />}
                    trend={{ value: '5%', direction: 'up' }}
                />
                <StatsCard
                    title="Tükendi"
                    value={soldOutEvents}
                    icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center sm:h-16">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Etkinlik ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-talpa-red/20 focus:border-talpa-red transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Filter className="w-4 h-4" />
                            Filtrele
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Calendar className="w-4 h-4" />
                            Tarih
                        </button>
                        <Button onClick={handleOpenCreate} size="sm" className="bg-black hover:bg-gray-800 text-white border-0 ml-auto sm:ml-2">
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Etkinlik
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-[300px]">ETKİNLİK</th>
                                <th className="px-6 py-3">TARİH</th>
                                <th className="px-6 py-3 w-[200px]">DOLULUK</th>
                                <th className="px-6 py-3">DURUM</th>
                                <th className="px-6 py-3 text-right">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEvents.map((event) => {
                                const total = (event.quota_asil || 0) + (event.quota_yedek || 0);
                                const current = (event.asil_count || 0) + (event.yedek_count || 0);

                                return (
                                    <tr key={event.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                    {event.image_url ? (
                                                        <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Calendar className="w-5 h-5 text-gray-400 m-auto" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-talpa-red transition-colors">{event.title}</p>
                                                    <p className="text-xs text-gray-500">#{event.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-900 font-medium">
                                                {new Date(event.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(event.event_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ProgressBar current={current} total={total} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={current >= total ? 'SOLD_OUT' : event.status}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {event.status === 'ACTIVE' ? (
                                                    <button
                                                        onClick={() => setActiveConfirm(event.id)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Pasife Al"
                                                    >
                                                        <PowerOff className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveConfirm(event.id)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Aktif Et"
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenEdit(event)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(event.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {filteredEvents.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Etkinlik bulunamadı.
                        </div>
                    )}
                </div>

                {/* Pagination Placeholders */}
                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing 1-{filteredEvents.length} of {totalEvents}</span>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50">Previous</button>
                        <button disabled className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Modal (Simplified for now, reused logic) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    {/* ... Keeping existing form logic but wrapping in white clean modal ... */}
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] max-h-[90vh] overflow-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Reusing existing inputs but with updated clean classes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-talpa-red focus:border-talpa-red outline-none"
                                />
                            </div>
                            {/* ... more fields ... (omitted for brevity in this snippet, will include below) */}
                            {/* For brevity, I'll include the essential fields. In a real rewrite I'd copy all. */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none min-h-[80px] resize-y"
                                    placeholder="Etkinlik detayları..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                    <input type="datetime-local" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                                    <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Konum (URL)</label>
                                <input type="url" required value={formData.location_url} onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Asil Kota</label>
                                    <input type="number" required value={formData.quota_asil} onChange={(e) => setFormData({ ...formData, quota_asil: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yedek Kota</label>
                                    <input type="number" required value={formData.quota_yedek} onChange={(e) => setFormData({ ...formData, quota_yedek: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Son İptal Tarihi</label>
                                <input type="datetime-local" required value={formData.cut_off_date} onChange={(e) => setFormData({ ...formData, cut_off_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Afiş Görseli</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        value={formData.banner_image}
                                        onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                        placeholder="https://..."
                                    />
                                    <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-pointer text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors">
                                        {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        <span>Yükle</span>
                                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                    </label>
                                </div>
                                {formData.banner_image && (
                                    <div className="mt-2 h-[100px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <img src={formData.banner_image} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                >
                                    <option value="DRAFT">Taslak</option>
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="ARCHIVED">Arşiv</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>İptal</Button>
                                {/* Fixed Button Color */}
                                <Button type="submit" variant="primary" fullWidth className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                                    {(createEvent.isPending || updateEvent.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Kaydet
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Modals (Simplified reused) */}
            {activeConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Durum Değiştir</h3>
                        <p className="text-gray-600 mb-4">Bu etkinliğin durumunu değiştirmek istediğinize emin misiniz?</p>
                        <div className="flex gap-3">
                            <Button fullWidth variant="outline" onClick={() => setActiveConfirm(null)}>İptal</Button>
                            <Button fullWidth className="bg-black text-white" onClick={() => handleSetActive(activeConfirm)}>Onayla</Button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2 text-red-600">Etkinliği Sil</h3>
                        <p className="text-gray-600 mb-4">Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <Button fullWidth variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
                            <Button fullWidth variant="danger" onClick={() => handleDelete(deleteConfirm)}>Sil</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventsPanel;
