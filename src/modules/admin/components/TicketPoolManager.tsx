import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadTicketPool } from '@/modules/file-processing';
import { getTicketStats, getTicketPool } from '@/modules/ticket/api/ticket.api';
import type { TicketStats, TicketPool } from '@/modules/ticket/types/ticket.types';

interface TicketPoolManagerProps {
    eventId: number;
}

export const TicketPoolManager: React.FC<TicketPoolManagerProps> = ({ eventId }) => {
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [pool, setPool] = useState<TicketPool[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, poolData] = await Promise.all([
                getTicketStats(eventId),
                getTicketPool(eventId, 1, 50) // Get first 50 for preview
            ]);
            setStats(statsData);
            setPool(poolData.data);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [eventId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress({ current: 0, total: 0 });
        setMessage(null);

        try {
            const result = await uploadTicketPool(eventId, file, (current, total) => {
                setUploadProgress({ current, total });
            });

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                loadData();
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Yükleme sırasında bir hata oluştu.' });
        } finally {
            setUploading(false);
            setUploadProgress(null);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Bilet Havuzu</h3>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    title="Yenile"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Toplam Bilet</p>
                    <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                </div>
                <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-lg">
                    <p className="text-sm text-green-400">Atanan</p>
                    <p className="text-2xl font-bold text-green-400">{stats?.assigned || 0}</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                    <p className="text-sm text-blue-400">Havuzda Bekleyen</p>
                    <p className="text-2xl font-bold text-blue-400">{stats?.unassigned || 0}</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center transition-colors hover:border-slate-600 hover:bg-slate-800/30">
                <input
                    type="file"
                    id="zip-upload"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                />
                <label htmlFor="zip-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                        <p className="text-slate-200 font-medium">Bilet Havuzunu Yükle (ZIP)</p>
                        <p className="text-sm text-slate-500 mt-1">Sadece .zip dosyaları. İçindeki PDF'ler otomatik işlenir.</p>
                    </div>
                </label>

                {uploading && (
                    <div className="mt-4">
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Yükleniyor... {uploadProgress?.current} / {uploadProgress?.total}
                        </p>
                    </div>
                )}
            </div>

            {/* Message Area */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p>{message.text}</p>
                </div>
            )}

            {/* File List Preview */}
            <div className="space-y-4">
                <h4 className="font-medium text-slate-300">Son Eklenenler</h4>
                <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
                    {pool.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800 text-slate-400">
                                <tr>
                                    <th className="p-3">Dosya Adı</th>
                                    <th className="p-3">Durum</th>
                                    <th className="p-3">Eklendiği Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {pool.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-slate-800/50">
                                        <td className="p-3 flex items-center gap-2 text-slate-300">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                            {ticket.file_name}
                                        </td>
                                        <td className="p-3">
                                            {ticket.is_assigned ? (
                                                <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">Atandı</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs bg-blue-900/30 text-blue-400">Boşta</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-500">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            Henüz bilet yüklenmemiş.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
