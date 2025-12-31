import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { TicketPool } from '../../types';

interface TicketPoolManagerProps {
  eventId: number;
}

export const TicketPoolManager: React.FC<TicketPoolManagerProps> = ({ eventId }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['ticketPool', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_pool')
        .select('*')
        .eq('event_id', eventId)
        .order('file_name', { ascending: true });

      if (error) throw error;
      return (data || []) as TicketPool[];
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Lütfen ZIP dosyası seçin.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Note: Full implementation would require:
      // 1. JSZip library to extract ZIP
      // 2. Upload each PDF to Supabase Storage
      // 3. Insert records into ticket_pool table
      
      // For now, show error that this needs implementation
      setError('Bilet havuzu yükleme henüz implement edilmedi. JSZip veya Edge Function gerekli.');
    } catch (err) {
      setError('Yükleme sırasında bir hata oluştu.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const unassignedCount = tickets?.filter(t => !t.is_assigned).length || 0;
  const totalCount = tickets?.length || 0;

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className="px-4 py-2 bg-talpa-primary text-white rounded-lg hover:bg-talpa-accent inline-block">
              {uploading ? 'Yükleniyor...' : 'ZIP Dosyası Seç'}
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-2">
            PDF biletlerinizi içeren ZIP dosyasını yükleyin
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Toplam Bilet</p>
          <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Atanmamış</p>
          <p className="text-2xl font-bold text-green-600">{unassignedCount}</p>
        </div>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : tickets && tickets.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Dosya Adı</th>
                <th className="px-4 py-2 text-left">Durum</th>
                <th className="px-4 py-2 text-left">Atanan</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      {ticket.file_name}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      ticket.is_assigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.is_assigned ? 'Atandı' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleDateString('tr-TR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Henüz bilet yüklenmedi
        </div>
      )}
    </div>
  );
};

