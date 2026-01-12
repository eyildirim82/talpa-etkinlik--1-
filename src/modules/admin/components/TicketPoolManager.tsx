import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { uploadTicketPool } from '@/modules/file-processing';
import { getTicketStats, getTicketPool } from '@/modules/ticket';
import type { TicketStats, TicketPool } from '@/modules/ticket';

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
            logger.error('TicketPoolManager error:', err);
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
        <div className="bg-ui-background-dark border border-ui-border-strong rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-h3 font-semibold text-text-inverse">Bilet Havuzu</h3>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-ui-background-dark-alt rounded-full transition-colors duration-normal ease-motion-default"
                    title="Yenile"
                >
                    <RefreshCw className={`w-5 h-5 text-text-inverse-muted ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-ui-background-dark-alt p-4 rounded-lg border border-ui-border-strong">
                    <p className="text-body-sm text-text-inverse-muted">Toplam Bilet</p>
                    <p className="text-h1 font-bold text-text-inverse">{stats?.total || 0}</p>
                </div>
                <div className="bg-state-success-bg/20 border border-state-success-border/50 p-4 rounded-lg">
                    <p className="text-body-sm text-state-success">Atanan</p>
                    <p className="text-h1 font-bold text-state-success">{stats?.assigned || 0}</p>
                </div>
                <div className="bg-state-info-bg/20 border border-state-info-border/50 p-4 rounded-lg">
                    <p className="text-body-sm text-state-info">Havuzda Bekleyen</p>
                    <p className="text-h1 font-bold text-state-info">{stats?.unassigned || 0}</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-ui-border-strong rounded-lg p-8 text-center transition-colors duration-normal ease-motion-default hover:border-ui-border hover:bg-ui-background-dark-alt">
                <input
                    type="file"
                    id="zip-upload"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                />
                <label htmlFor="zip-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-ui-background-dark-alt flex items-center justify-center">
                        <Upload className="w-6 h-6 text-text-inverse-muted" />
                    </div>
                    <div>
                        <p className="text-text-inverse font-medium">Bilet Havuzunu Yükle (ZIP)</p>
                        <p className="text-body-sm text-text-inverse-muted mt-1">Sadece .zip dosyaları. İçindeki PDF'ler otomatik işlenir.</p>
                    </div>
                </label>

                {uploading && (
                    <div className="mt-4">
                        <div className="h-2 w-full bg-ui-background-dark-alt rounded-full overflow-hidden">
                            <div
                                className="h-full bg-state-info transition-all duration-slow ease-motion-default"
                                style={{ width: `${uploadProgress ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` } as React.CSSProperties}
                            />
                        </div>
                        <p className="text-caption text-text-inverse-muted mt-2">
                            Yükleniyor... {uploadProgress?.current} / {uploadProgress?.total}
                        </p>
                    </div>
                )}
            </div>

            {/* Message Area */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-state-success-bg/20 text-state-success border border-state-success-border/50' 
                        : 'bg-state-error-bg/20 text-state-error border border-state-error-border/50'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-body-sm">{message.text}</p>
                </div>
            )}

            {/* File List Preview */}
            <div className="space-y-4">
                <h4 className="font-medium text-text-inverse">Son Eklenenler</h4>
                <div className="bg-ui-background-dark-alt rounded-lg overflow-hidden border border-ui-border-strong">
                    {pool.length > 0 ? (
                        <table className="w-full text-body-sm text-left">
                            <thead className="bg-ui-background-dark text-text-inverse-muted">
                                <tr>
                                    <th className="p-3">Dosya Adı</th>
                                    <th className="p-3">Durum</th>
                                    <th className="p-3">Eklendiği Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border-strong">
                                {pool.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-ui-background-dark-alt transition-colors duration-normal ease-motion-default">
                                        <td className="p-3 flex items-center gap-2 text-text-inverse">
                                            <FileText className="w-4 h-4 text-text-inverse-muted" />
                                            {ticket.file_name}
                                        </td>
                                        <td className="p-3">
                                            {ticket.is_assigned ? (
                                                <span className="px-2 py-1 rounded-full text-caption bg-state-success-bg/30 text-state-success">Atandı</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-caption bg-state-info-bg/30 text-state-info">Boşta</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-text-inverse-muted">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-text-inverse-muted">
                            Henüz bilet yüklenmemiş.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
