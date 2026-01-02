import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBookingsWithFilters } from '../../src/api/bookings';
import { assignTicket, exportBookingsToExcel, cancelBooking } from '../../actions/admin';

interface BookingsTableProps {
  eventId: number;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ eventId }) => {
  const [queueFilter, setQueueFilter] = useState<'ASIL' | 'YEDEK' | 'IPTAL' | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'WAITING' | 'PAID' | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings', eventId, queueFilter, paymentFilter, page],
    queryFn: () => getBookingsWithFilters(eventId, {
      queue_status: queueFilter !== 'ALL' ? queueFilter : undefined,
      payment_status: paymentFilter !== 'ALL' ? paymentFilter : undefined,
      page,
      pageSize
    }),
    placeholderData: (previousData) => previousData // Keep displaying previous data while fetching new page
  });

  const bookings = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleAssignTicket = async (bookingId: number) => {
    const result = await assignTicket(bookingId);
    if (result.success) {
      alert(result.message);
      refetch();
    } else {
      alert(result.message);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Bu başvuruyu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    const result = await cancelBooking(bookingId, eventId);
    alert(result.message);
    refetch();
  };

  const handleExportExcel = async () => {
    const blob = await exportBookingsToExcel(eventId);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-event-${eventId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [queueFilter, paymentFilter]);

  if (isLoading && !data) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-talpa-card rounded-2xl border border-talpa-border/40 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-talpa-gold pointer-events-none group-hover:text-talpa-primary transition-colors" />
            <select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2.5 bg-talpa-bg border border-talpa-border text-talpa-primary rounded-xl text-sm appearance-none focus:outline-none focus:border-talpa-gold focus:ring-1 focus:ring-talpa-gold/50 transition-all cursor-pointer hover:border-talpa-gold/30 min-w-[160px]"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ASIL">Asil</option>
              <option value="YEDEK">Yedek</option>
              <option value="IPTAL">İptal</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-talpa-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Payment Filter */}
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="pl-4 pr-8 py-2.5 bg-talpa-bg border border-talpa-border text-talpa-primary rounded-xl text-sm appearance-none focus:outline-none focus:border-talpa-gold focus:ring-1 focus:ring-talpa-gold/50 transition-all cursor-pointer hover:border-talpa-gold/30 min-w-[160px]"
            >
              <option value="ALL">Tüm Ödemeler</option>
              <option value="WAITING">Bekleyen</option>
              <option value="PAID">Ödendi</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-talpa-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-talpa-secondary">
            Toplam: <strong className="text-talpa-gold text-lg ml-1">{totalCount}</strong> <span className="text-xs opacity-70">kayıt</span>
          </span>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-talpa-gold to-[#B5952F] text-talpa-bg font-bold rounded-xl hover:shadow-lg hover:shadow-talpa-gold/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-talpa-border/30 rounded-2xl bg-talpa-card/50 backdrop-blur-sm shadow-2xl">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-black/20 border-b border-talpa-border/30">
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase w-16">Sıra</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">Katılımcı</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">İletişim / Sicil</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">Başvuru Tarihi</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">Durum</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">Ödeme</th>
              <th className="px-6 py-4 text-left font-semibold text-talpa-gold tracking-wider text-xs uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-talpa-border/10">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: any, index: number) => {
                const profile = booking.profiles;
                const rowNumber = (page - 1) * pageSize + index + 1;

                // Get Initials
                const initials = profile.full_name
                  ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : '??';

                return (
                  <tr key={booking.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 text-talpa-secondary font-mono text-xs opacity-50">{rowNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-talpa-gold to-yellow-700 flex items-center justify-center text-talpa-bg font-bold text-xs shadow-lg shadow-talpa-gold/20 transform group-hover:scale-110 transition-transform">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-talpa-gold transition-colors">{profile.full_name}</div>
                          <div className="text-xs text-talpa-secondary hidden md:block opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5">Katılımcı</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-talpa-secondary">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/80 font-medium text-xs bg-white/5 py-0.5 px-2 rounded w-fit">{profile.sicil_no || 'Sicil Yok'}</span>
                        <span className="text-xs text-talpa-secondary/70">{profile.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-talpa-secondary font-medium">
                      {new Date(booking.booking_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${booking.queue_status === 'ASIL' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                          booking.queue_status === 'YEDEK' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${booking.queue_status === 'ASIL' ? 'bg-green-400 animate-pulse' :
                            booking.queue_status === 'YEDEK' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                        {booking.queue_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${booking.payment_status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {booking.payment_status === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {booking.payment_status === 'WAITING' && booking.queue_status === 'ASIL' && (
                          <button
                            onClick={() => handleAssignTicket(booking.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-talpa-gold to-yellow-600 text-talpa-bg font-bold rounded-lg text-xs hover:to-yellow-500 shadow-lg shadow-talpa-gold/20 transform hover:-translate-y-0.5 transition-all"
                          >
                            Onayla
                          </button>
                        )}
                        {booking.queue_status !== 'IPTAL' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-1.5 bg-white/5 text-red-400 border border-red-900/30 rounded-lg text-xs hover:bg-red-900/20 hover:border-red-500/50 transition-all font-medium"
                          >
                            İptal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-talpa-secondary italic">
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-talpa-card rounded-xl border border-talpa-border/30 shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-talpa-border text-talpa-primary rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-talpa-gold/50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Önceki
          </button>
          <span className="text-sm text-talpa-secondary font-medium">
            Sayfa <span className="text-talpa-gold">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border border-talpa-border text-talpa-primary rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-talpa-gold/50 transition-all"
          >
            Sonraki <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

