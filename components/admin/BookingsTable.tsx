import React, { useState } from 'react';
import { Download, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBookingsWithFilters } from '../../src/api/bookings';
import { assignTicket, promoteFromWaitlist, exportBookingsToExcel } from '../../actions/admin';
import { QueueStatus, PaymentStatus } from '../../types';

interface BookingsTableProps {
  eventId: number;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ eventId }) => {
  const [queueFilter, setQueueFilter] = useState<'ASIL' | 'YEDEK' | 'IPTAL' | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'WAITING' | 'PAID' | 'ALL'>('ALL');

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['bookings', eventId, queueFilter, paymentFilter],
    queryFn: () => getBookingsWithFilters(eventId, {
      queue_status: queueFilter !== 'ALL' ? queueFilter : undefined,
      payment_status: paymentFilter !== 'ALL' ? paymentFilter : undefined
    })
  });

  const handleAssignTicket = async (bookingId: number) => {
    const result = await assignTicket(bookingId);
    if (result.success) {
      refetch();
    } else {
      alert(result.message);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Bu başvuruyu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    // Cancel booking and promote from waitlist
    // Note: This should update booking status to IPTAL and call promote_from_waitlist
    // For now, we'll just show an alert
    alert('İptal işlemi henüz implement edilmedi.');
  };

  const handleExportExcel = async () => {
    const blob = await exportBookingsToExcel(eventId);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-event-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ASIL">Asil</option>
              <option value="YEDEK">Yedek</option>
              <option value="IPTAL">İptal</option>
            </select>
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="ALL">Tüm Ödemeler</option>
            <option value="WAITING">Bekleyen</option>
            <option value="PAID">Ödendi</option>
          </select>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          Excel İndir
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Sıra</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Ad Soyad</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Sicil No</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Başvuru Zamanı</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Durum</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Ödeme</th>
              <th className="border border-gray-300 px-4 py-2 text-left">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: any, index: number) => {
                const profile = booking.profiles;
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{profile.full_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{profile.sicil_no || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(booking.booking_date).toLocaleString('tr-TR')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        booking.queue_status === 'ASIL' ? 'bg-green-100 text-green-800' :
                        booking.queue_status === 'YEDEK' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.queue_status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        booking.payment_status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.payment_status === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        {booking.payment_status === 'WAITING' && booking.queue_status === 'ASIL' && (
                          <button
                            onClick={() => handleAssignTicket(booking.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Ödeme Onayla ve Bilet Gönder
                          </button>
                        )}
                        {booking.queue_status !== 'IPTAL' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            İptal Et
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  Başvuru bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

