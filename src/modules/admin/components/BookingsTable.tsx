/**
 * BookingsTable Component
 * Admin table for managing event bookings
 * 
 * Uses domain module APIs:
 * - booking: getBookingsAdmin, cancelBookingAdmin, exportBookingsToExcel
 * - ticket: assignTicket
 */
import React, { useState, useEffect } from 'react';
import {
    Check, X, Search,
    Download,
    CreditCard, User
} from 'lucide-react';
import { logger } from '@/shared/utils/logger';
// Domain module imports - using public APIs only
import {
    getBookingsAdmin,
    cancelBookingAdmin,
    exportBookingsToExcel,
    downloadExportedFile,
    type BookingWithProfile,
    type BookingFilters
} from '@/modules/booking';
import { assignTicket } from '@/modules/ticket';

interface BookingsTableProps {
    eventId: number;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ eventId }) => {
    const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState<{
        text: string;
        status: 'ALL' | 'ASIL' | 'YEDEK' | 'IPTAL';
        payment: 'ALL' | 'WAITING' | 'PAID';
    }>({
        text: '',
        status: 'ALL',
        payment: 'ALL'
    });
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const bookingFilters: BookingFilters = {
                queue_status: filters.status !== 'ALL' ? filters.status : undefined,
                payment_status: filters.payment !== 'ALL' ? filters.payment : undefined,
                page: 1,
                pageSize: 100
            };
            const result = await getBookingsAdmin(eventId, bookingFilters);
            setBookings(result.data);
            setTotalCount(result.count);
        } catch (error) {
            logger.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [eventId, filters]);

    const handleAssignTicket = async (bookingId: number) => {
        if (!confirm('Ödemeyi onaylayıp bilet atamak istiyor musunuz?')) return;

        setProcessingId(bookingId);
        try {
            const result = await assignTicket(bookingId);
            if (result.success) {
                alert(result.message);
                loadBookings();
            } else {
                alert('Hata: ' + result.message);
            }
        } catch (error) {
            logger.error('Error assigning ticket:', error);
            alert('Beklenmeyen bir hata oluştu');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (bookingId: number) => {
        if (!confirm('Bu başvuruyu iptal etmek istediğinize emin misiniz?')) return;

        setProcessingId(bookingId);
        try {
            const result = await cancelBookingAdmin(bookingId, eventId);
            if (result.success) {
                alert(result.message);
                loadBookings();
            } else {
                alert('Hata: ' + result.message);
            }
        } catch (error) {
            logger.error('Error canceling booking:', error);
            alert('Beklenmeyen bir hata oluştu');
        } finally {
            setProcessingId(null);
        }
    };

    const handleExport = async () => {
        const result = await exportBookingsToExcel(eventId);
        if (result.success && result.data) {
            downloadExportedFile(result.data, `basvurular-event-${eventId}.xlsx`);
        } else {
            alert(result.error || 'Excel oluşturulurken hata oluştu');
        }
    };

    const clearFilters = () => {
        setFilters({
            text: '',
            status: 'ALL',
            payment: 'ALL'
        });
    };

    return (
        <div className="space-y-4">
            {/* Filters Section */}
            <div className="bg-ui-background-dark border border-ui-border-strong rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="space-y-1.5">
                            <label className="text-caption font-medium text-text-secondary">Durum</label>
                            <select
                                className="w-full md:w-48 bg-ui-surface text-text-primary border border-ui-border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-interactive-focus-ring focus:border-interactive-focus-border transition-all duration-normal ease-motion-default shadow-sm"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                            >
                                <option value="ALL">Tüm Durumlar</option>
                                <option value="ASIL">Asil Liste</option>
                                <option value="YEDEK">Yedek Liste</option>
                                <option value="IPTAL">İptal Edilenler</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-caption font-medium text-text-secondary">Ödeme</label>
                            <select
                                className="w-full md:w-48 bg-ui-surface text-text-primary border border-ui-border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-interactive-focus-ring focus:border-interactive-focus-border transition-all duration-normal ease-motion-default shadow-sm"
                                value={filters.payment}
                                onChange={(e) => setFilters(prev => ({ ...prev, payment: e.target.value as any }))}
                            >
                                <option value="ALL">Tüm Ödemeler</option>
                                <option value="WAITING">Bekleyenler</option>
                                <option value="PAID">Ödenenler</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-ui-background-dark rounded-lg text-body-sm font-medium transition-colors duration-normal ease-motion-default shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Excel İndir
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-body-sm text-text-secondary font-medium">
                    Toplam: <span className="text-text-primary font-bold">{totalCount}</span> kayıt
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-ui-surface border border-ui-border rounded-lg overflow-hidden min-h-[400px] relative">
                {bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-body-sm text-left">
                            <thead className="bg-ui-background text-text-secondary uppercase text-caption border-b border-ui-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Sıra</th>
                                    <th className="px-6 py-4 font-semibold">Kişi Bilgileri</th>
                                    <th className="px-6 py-4 font-semibold">Başvuru Tarihi</th>
                                    <th className="px-6 py-4 font-semibold">Sıra Durumu</th>
                                    <th className="px-6 py-4 font-semibold">Ödeme</th>
                                    <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border-subtle">
                                {bookings.map((booking, index) => {
                                    const profile = booking.profiles;
                                    return (
                                        <tr key={booking.id} className="hover:bg-interactive-hover-surface transition-colors">
                                            <td className="px-6 py-4 text-text-secondary font-mono font-medium">
                                                #{index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-ui-background flex items-center justify-center text-text-secondary">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-text-primary font-medium">{profile?.full_name}</div>
                                                        <div className="text-text-secondary text-caption">{profile?.email}</div>
                                                        <div className="text-text-muted text-caption">TC: {profile?.tckn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {new Date(booking.booking_date).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-caption font-semibold ${booking.queue_status === 'ASIL' ? 'bg-state-success-bg text-state-success-text' :
                                                    booking.queue_status === 'YEDEK' ? 'bg-state-warning-bg text-state-warning-text' :
                                                        'bg-state-error-bg text-state-error-text'
                                                    }`}>
                                                    {booking.queue_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-caption font-medium ${booking.payment_status === 'PAID' ? 'text-state-success' : 'text-text-secondary'
                                                    }`}>
                                                    {booking.payment_status === 'PAID' ? (
                                                        <><Check className="w-3 h-3" /> Ödendi</>
                                                    ) : (
                                                        <><CreditCard className="w-3 h-3" /> Bekliyor</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {booking.payment_status === 'WAITING' && booking.queue_status !== 'IPTAL' && (
                                                        <button
                                                            onClick={() => handleAssignTicket(booking.id)}
                                                            disabled={processingId === booking.id}
                                                            className="p-1.5 hover:bg-state-success-bg text-state-success rounded transition-colors"
                                                            title="Ödemeyi Onayla ve Bilet Ata"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {booking.queue_status !== 'IPTAL' && (
                                                        <button
                                                            onClick={() => handleCancel(booking.id)}
                                                            disabled={processingId === booking.id}
                                                            className="p-1.5 hover:bg-state-error-bg text-state-error rounded transition-colors"
                                                            title="İptal Et"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-ui-background rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-text-muted" />
                        </div>
                        <h3 className="text-h3 font-bold text-text-primary mb-2">Kayıt bulunamadı</h3>
                        <p className="text-text-secondary max-w-sm mb-8">
                            Seçilen kriterlere uygun başvuru veya bilet bulunmamaktadır. Filtreleri değiştirerek tekrar deneyin.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2.5 bg-ui-surface border border-ui-border text-text-primary font-medium rounded-lg hover:bg-interactive-hover-surface hover:border-interactive-hover-border transition-all shadow-sm"
                        >
                            Filtreleri Temizle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
