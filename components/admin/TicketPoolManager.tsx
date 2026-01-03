import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { getTicketPool, getTicketStats } from '@/modules/ticket';
import { processTicketZip } from '@/modules/file-processing';
import type { TicketPool } from '@/modules/ticket';

interface TicketPoolManagerProps {
  eventId: number;
}

export const TicketPoolManager: React.FC<TicketPoolManagerProps> = ({ eventId }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const supabase = createBrowserClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ticketPool', eventId, page],
    queryFn: async () => {
      return await getTicketPool(eventId, page, pageSize);
    },
    placeholderData: (prev) => prev
  });

  const tickets = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Separate query for counts (assigned/unassigned stats) to stay accurate regardless of pagination
  const { data: stats } = useQuery({
    queryKey: ['ticketStats', eventId],
    queryFn: async () => {
      return await getTicketStats(eventId);
    }
  });

  const unassignedCount = stats?.unassigned || 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Lütfen ZIP dosyası seçin.');
      return;
    }

    setUploading(true);
    setError(null);
    setStatusMessage('ZIP dosyası yükleniyor...');

    try {
      // 1. Upload to 'temp-uploads' bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('temp-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setStatusMessage('Biletler sunucuda işleniyor (bu işlem birkaç saniye sürebilir)...');

      // 2. Process ZIP file
      const result = await processTicketZip(eventId, filePath);

      if (!result.success) {
        throw new Error(result.message || 'İşlem başarısız oldu.');
      }

      setStatusMessage(null);
      alert(`${result.count} bilet başarıyla işlendi ve eklendi.`);

      refetch();

    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Yükleme ve işleme sırasında bir hata oluştu.');
    } finally {
      setUploading(false);
      setStatusMessage(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-talpa-border/30 rounded-xl p-8 bg-talpa-card hover:bg-white/5 transition-colors group">
        <div className="text-center">
          <div className="w-16 h-16 bg-talpa-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-talpa-gold/20 transition-colors">
            <Upload className="w-8 h-8 text-talpa-gold" />
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className={`px-6 py-2.5 bg-gradient-to-r from-talpa-gold to-yellow-600 text-talpa-bg font-bold rounded-lg hover:to-yellow-500 shadow-lg shadow-yellow-500/20 inline-flex items-center gap-2 transform active:scale-95 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusMessage || 'İşleniyor...'}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  ZIP Dosyası Seç
                </>
              )}
            </span>
          </label>
          <p className="text-sm text-talpa-secondary mt-3">
            PDF biletlerinizi içeren ZIP dosyasını yükleyin. <br />
            <span className="text-xs opacity-60">(Sunucu tarafında otomatik olarak açılacaktır)</span>
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-talpa-card border border-blue-900/30 rounded-lg shadow-sm">
          <p className="text-sm text-talpa-secondary font-medium">Toplam Bilet (Havuz)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="p-4 bg-talpa-card border border-green-900/30 rounded-lg shadow-sm">
          <p className="text-sm text-talpa-secondary font-medium">Atanmamış</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{unassignedCount}</p>
        </div>
      </div>

      {/* Ticket List */}
      {isLoading && !data ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-talpa-gold" />
          <p className="mt-2 text-sm text-talpa-secondary">Biletler yükleniyor...</p>
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="border border-talpa-border/30 rounded-xl overflow-hidden bg-talpa-card shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-talpa-gold font-medium border-b border-talpa-border/30">
                <tr>
                  <th className="px-4 py-3">Sıra</th>
                  <th className="px-4 py-3">Dosya Adı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Atanma Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-talpa-border/20">
                {tickets.map((ticket, idx) => (
                  <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-talpa-secondary">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-talpa-secondary flex-shrink-0" />
                        <span className="truncate max-w-[200px] text-talpa-primary" title={ticket.file_name}>
                          {ticket.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.is_assigned
                        ? 'bg-green-900/40 text-green-400 border border-green-800'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                        {ticket.is_assigned ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />}
                        {ticket.is_assigned ? 'Atandı' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-talpa-secondary font-mono">
                      {ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-talpa-border/30 p-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-talpa-border text-talpa-primary rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-talpa-gold/50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Önceki
              </button>
              <span className="text-sm text-talpa-secondary">
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
      ) : (
        <div className="text-center py-10 bg-talpa-card rounded-lg border border-dashed border-talpa-border/30">
          <p className="text-talpa-secondary text-sm">Henüz bu etkinlik için bilet yüklenmemiş.</p>
        </div>
      )}
    </div>
  );
};
