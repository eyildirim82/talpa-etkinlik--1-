import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBookingsWithFilters } from '@/modules/booking';
import { assignTicket } from '@/modules/ticket';
import { exportBookingsToExcel, cancelBooking } from '@/modules/admin';

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
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-talpa-gold/20 border-t-talpa-gold rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-talpa-gold/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="mt-6 text-talpa-secondary font-medium text-lg">Yükleniyor...</p>
        <p className="mt-2 text-talpa-secondary/60 text-sm">Başvurular getiriliyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="relative bg-gradient-to-br from-talpa-card/90 via-talpa-card/70 to-talpa-card/50 backdrop-blur-2xl border border-talpa-border/60 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-talpa-gold/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-talpa-gold/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-talpa-gold/70 pointer-events-none group-hover:text-talpa-gold transition-colors z-10" />
                <select
                  value={queueFilter}
                  onChange={(e) => setQueueFilter(e.target.value as any)}
                  className="relative pl-11 pr-10 py-3 bg-talpa-bg/80 backdrop-blur-sm border border-talpa-border/50 text-talpa-primary rounded-xl text-sm font-medium appearance-none focus:outline-none focus:border-talpa-gold focus:ring-2 focus:ring-talpa-gold/30 transition-all cursor-pointer hover:border-talpa-gold/50 hover:bg-talpa-bg min-w-[180px] shadow-lg shadow-black/20"
                >
                  <option value="ALL">Tüm Durumlar</option>
                  <option value="ASIL">Asil</option>
                  <option value="YEDEK">Yedek</option>
                  <option value="IPTAL">İptal</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-4 h-4 text-talpa-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Payment Filter */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-talpa-gold/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="relative pl-4 pr-10 py-3 bg-talpa-bg/80 backdrop-blur-sm border border-talpa-border/50 text-talpa-primary rounded-xl text-sm font-medium appearance-none focus:outline-none focus:border-talpa-gold focus:ring-2 focus:ring-talpa-gold/30 transition-all cursor-pointer hover:border-talpa-gold/50 hover:bg-talpa-bg min-w-[180px] shadow-lg shadow-black/20"
                >
                  <option value="ALL">Tüm Ödemeler</option>
                  <option value="WAITING">Bekleyen</option>
                  <option value="PAID">Ödendi</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-4 h-4 text-talpa-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Stats and Export Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-talpa-bg/60 backdrop-blur-sm border border-talpa-border/40 rounded-xl shadow-lg">
                <span className="text-sm font-medium text-talpa-secondary">
                  Toplam:
                </span>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400">
                  {totalCount}
                </span>
                <span className="text-xs text-talpa-secondary/70 font-medium">
                  kayıt
                </span>
              </div>
              <button
                onClick={handleExportExcel}
                className="group relative flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-talpa-gold via-[#D4AF37] to-[#B5952F] text-talpa-bg font-bold rounded-xl hover:shadow-2xl hover:shadow-talpa-gold/30 hover:scale-[1.03] active:scale-[0.98] transition-all text-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Download className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Excel İndir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden border border-talpa-border/50 rounded-3xl bg-gradient-to-br from-talpa-card/80 via-talpa-card/60 to-talpa-card/40 backdrop-blur-2xl shadow-2xl shadow-black/40">
        {/* Table header gradient */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-talpa-gold/10 via-talpa-gold/5 to-transparent pointer-events-none"></div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-black/30 via-black/20 to-transparent border-b border-talpa-border/40 backdrop-blur-sm">
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase w-20">Sıra</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">Katılımcı</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">İletişim / Sicil</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">Başvuru Tarihi</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">Durum</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">Ödeme</th>
                <th className="px-6 py-5 text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400 tracking-wider text-xs uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-talpa-border/20">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: any, index: number) => {
                const profile = booking.profiles;
                const rowNumber = (page - 1) * pageSize + index + 1;

                // Get Initials
                const initials = profile.full_name
                  ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : '??';

                return (
                  <tr key={booking.id} className="group relative hover:bg-gradient-to-r hover:from-white/[0.04] hover:via-white/[0.02] hover:to-transparent transition-all duration-300 border-b border-talpa-border/10 last:border-0">
                    {/* Row hover effect */}
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-talpa-gold/0 via-talpa-gold/50 to-talpa-gold/0 opacity-0 group-hover:opacity-100 transition-opacity"></td>
                    
                    <td className="px-6 py-5 text-talpa-secondary/60 font-mono text-sm font-semibold relative">
                      <span className="relative z-10">{rowNumber}</span>
                    </td>
                    <td className="px-6 py-5 relative">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-talpa-gold to-yellow-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-talpa-gold via-yellow-500 to-yellow-700 flex items-center justify-center text-talpa-bg font-bold text-sm shadow-xl shadow-talpa-gold/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            {initials}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-talpa-gold group-hover:to-yellow-400 transition-all duration-300 text-base">
                            {profile.full_name}
                          </div>
                          <div className="text-xs text-talpa-secondary/60 hidden md:block mt-0.5">Katılımcı</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 relative">
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center text-white/90 font-semibold text-xs bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm py-1.5 px-3 rounded-lg border border-white/10 w-fit shadow-md">
                          {profile.sicil_no || 'Sicil Yok'}
                        </span>
                        <span className="text-xs text-talpa-secondary/80 font-medium">{profile.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-talpa-secondary/90 font-semibold text-sm relative">
                      <span className="relative z-10">
                        {new Date(booking.booking_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-5 relative">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-md transition-all duration-300 ${
                        booking.queue_status === 'ASIL' 
                          ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-300 border-green-500/40 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/30 group-hover:scale-105' 
                          : booking.queue_status === 'YEDEK' 
                          ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 text-yellow-300 border-yellow-500/40 shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/30 group-hover:scale-105'
                          : 'bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-300 border-red-500/40 shadow-lg shadow-red-500/20'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          booking.queue_status === 'ASIL' 
                            ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                            : booking.queue_status === 'YEDEK' 
                            ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                            : 'bg-red-400'
                        }`}></span>
                        {booking.queue_status}
                      </span>
                    </td>
                    <td className="px-6 py-5 relative">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm transition-all duration-300 ${
                        booking.payment_status === 'PAID' 
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-300 border-blue-500/40 shadow-md shadow-blue-500/20 group-hover:scale-105' 
                          : 'bg-gradient-to-br from-gray-500/20 to-gray-600/10 text-gray-300 border-gray-500/40'
                      }`}>
                        {booking.payment_status === 'PAID' ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Ödendi
                          </>
                        ) : (
                          'Bekliyor'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-5 relative">
                      <div className="flex gap-2.5">
                        {booking.payment_status === 'WAITING' && booking.queue_status === 'ASIL' && (
                          <button
                            onClick={() => handleAssignTicket(booking.id)}
                            className="group/btn relative px-4 py-2 bg-gradient-to-r from-talpa-gold via-yellow-500 to-yellow-600 text-talpa-bg font-bold rounded-lg text-xs hover:shadow-xl hover:shadow-talpa-gold/40 transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative z-10">Onayla</span>
                          </button>
                        )}
                        {booking.queue_status !== 'IPTAL' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-gradient-to-br from-red-500/10 to-red-600/5 text-red-300 border-2 border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
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
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-talpa-gold/20 to-transparent flex items-center justify-center border border-talpa-gold/30">
                      <svg className="w-8 h-8 text-talpa-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-talpa-secondary/70 font-medium text-base">Kayıt bulunamadı</p>
                    <p className="text-talpa-secondary/50 text-sm">Filtreleri değiştirerek tekrar deneyin</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="relative bg-gradient-to-br from-talpa-card/80 to-talpa-card/50 backdrop-blur-xl border border-talpa-border/50 rounded-2xl shadow-xl shadow-black/20 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="group flex items-center gap-2 px-5 py-2.5 bg-talpa-bg/60 backdrop-blur-sm border-2 border-talpa-border/50 text-talpa-primary rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-talpa-gold/50 hover:shadow-lg hover:shadow-talpa-gold/10 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              <span>Önceki</span>
            </button>
            <div className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-talpa-gold/10 to-transparent border border-talpa-gold/30 rounded-xl">
              <span className="text-sm text-talpa-secondary font-medium">
                Sayfa
              </span>
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold to-yellow-400">
                {page}
              </span>
              <span className="text-sm text-talpa-secondary/70 font-medium">
                /
              </span>
              <span className="text-sm text-talpa-secondary font-semibold">
                {totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="group flex items-center gap-2 px-5 py-2.5 bg-talpa-bg/60 backdrop-blur-sm border-2 border-talpa-border/50 text-talpa-primary rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-talpa-gold/50 hover:shadow-lg hover:shadow-talpa-gold/10 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Sonraki</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

