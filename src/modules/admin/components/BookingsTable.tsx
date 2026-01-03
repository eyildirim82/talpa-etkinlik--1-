import React, { useState, useEffect } from 'react';
import {
    Check, X, Search, Filter,
    MoreHorizontal, Download,
    CreditCard, Calendar, User
} from 'lucide-react';
import { getBookingsWithFilters } from '@/modules/booking/api/booking.api';
import { cancelBooking, exportBookingsToExcel } from '@/modules/admin/api/admin.api';
import { assignTicket } from '@/modules/ticket/api/ticket.api';
import type { Booking } from '@/modules/booking/types/booking.types';

interface BookingsTableProps {
    eventId: number;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ eventId }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        text: '',
        status: 'ALL' as 'ALL' | 'ASIL' | 'YEDEK' | 'IPTAL',
        payment: 'ALL' as 'ALL' | 'WAITING' | 'PAID'
    });
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const result = await getBookingsWithFilters(eventId, {
                queue_status: filters.status !== 'ALL' ? filters.status : undefined,
                payment_status: filters.payment !== 'ALL' ? filters.payment : undefined,
                page: 1, // Pagination can be added later
                pageSize: 100
            });
            setBookings(result.data);
            setTotalCount(result.count);
        } catch (error) {
            console.error(error);
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
            console.error(error);
            alert('Beklenmeyen bir hata oluştu');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (bookingId: number) => {
        if (!confirm('Bu başvuruyu iptal etmek istediğinize emin misiniz?')) return;

        setProcessingId(bookingId);
        try {
            const result = await cancelBooking(bookingId, eventId);
            if (result.success) {
                alert(result.message);
                loadBookings();
            } else {
                alert('Hata: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Beklenmeyen bir hata oluştu');
        } finally {
            setProcessingId(null);
        }
    };

    const handleExport = async () => {
        const blob = await exportBookingsToExcel(eventId);
        if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `basvurular-event-${eventId}.xlsx`;
            a.click();
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <div className="flex gap-2">
                    <select
                        className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-2 text-sm"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="ASIL">Asil Liste</option>
                        <option value="YEDEK">Yedek Liste</option>
                        <option value="IPTAL">İptal Edilenler</option>
                    </select>

                    <select
                        className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-2 text-sm"
                        value={filters.payment}
                        onChange={(e) => setFilters(prev => ({ ...prev, payment: e.target.value as any }))}
                    >
                        <option value="ALL">Tüm Ödemeler</option>
                        <option value="WAITING">Bekleyenler</option>
                        <option value="PAID">Ödenenler</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    >
                        <Download className="w-4 h-4" /> Excel İndir
                    </button>
                    <button
                        onClick={loadBookings}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Sıra</th>
                                <th className="px-6 py-4">Kişi Bilgileri</th>
                                <th className="px-6 py-4">Başvuru Tarihi</th>
                                <th className="px-6 py-4">Sıra Durumu</th>
                                <th className="px-6 py-4">Ödeme</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {bookings.map((booking, index) => {
                                const profile = booking.profiles;
                                return (
                                    <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 font-mono">
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{profile?.full_name}</div>
                                                    <div className="text-slate-500 text-xs">{profile?.email}</div>
                                                    <div className="text-slate-600 text-xs">TC: {profile?.tckn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(booking.booking_date).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${booking.queue_status === 'ASIL' ? 'bg-green-900/30 text-green-400' :
                                                    booking.queue_status === 'YEDEK' ? 'bg-yellow-900/30 text-yellow-400' :
                                                        'bg-red-900/30 text-red-400'
                                                }`}>
                                                {booking.queue_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${booking.payment_status === 'PAID' ? 'text-green-400' : 'text-slate-400'
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
                                                        className="p-1.5 hover:bg-green-900/30 text-green-400 rounded transition-colors"
                                                        title="Ödemeyi Onayla ve Bilet Ata"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.queue_status !== 'IPTAL' && (
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        disabled={processingId === booking.id}
                                                        className="p-1.5 hover:bg-red-900/30 text-red-400 rounded transition-colors"
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
                            {bookings.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
