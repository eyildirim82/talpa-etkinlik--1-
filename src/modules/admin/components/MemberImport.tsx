import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createBrowserClient } from '@/shared/infrastructure/supabase';

interface MemberData {
    tckn: string;
    sicil_no: string;
    email: string;
    full_name: string;
    status: 'PENDING' | 'SUCCESS' | 'ERROR';
    message?: string;
}

export const MemberImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<MemberData[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = async (file: File) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            // Validate and map data
            const mappedData: MemberData[] = jsonData.map((row: any) => ({
                tckn: row['tckn'] || row['TCKN'] || '',
                sicil_no: row['sicil_no'] || row['SICIL_NO'] || '',
                email: row['email'] || row['EMAIL'] || '',
                full_name: row['full_name'] || row['AD_SOYAD'] || '',
                status: 'PENDING' as const
            })).filter(item => item.email && item.tckn); // Basic validation

            if (mappedData.length === 0) {
                setError('Dosyada geçerli veri bulunamadı. Kolon isimlerini kontrol edin: tckn, sicil_no, email, full_name');
            } else {
                setError(null);
                setData(mappedData);
            }
        } catch (err) {
            console.error(err);
            setError('Dosya okunurken hata oluştu.');
        }
    };

    const handleImport = async () => {
        if (!data.length) return;

        setImporting(true);

        try {
            // Call Supabase Edge Function
            const { data: results, error } = await supabase.functions.invoke('import-users', {
                body: { users: data }
            });

            if (error) throw error;

            // Process results to update UI
            const updatedData = [...data];

            // Map results back to data grid
            // Expecting results array like: [{ email: '...', status: 'success' | 'error' }]
            if (Array.isArray(results)) {
                results.forEach((res: any) => {
                    const index = updatedData.findIndex(d => d.email === res.email);
                    if (index !== -1) {
                        if (res.status === 'success') {
                            updatedData[index] = { ...updatedData[index], status: 'SUCCESS', message: 'Kullanıcı oluşturuldu.' };
                        } else if (res.status === 'exists') {
                            updatedData[index] = { ...updatedData[index], status: 'SUCCESS', message: 'Kullanıcı zaten mevcut.' };
                        } else {
                            updatedData[index] = { ...updatedData[index], status: 'ERROR', message: res.message || 'Hata oluştu.' };
                        }
                    }
                });
            }

            setData(updatedData);

            const successCount = results.filter((r: any) => r.status === 'success' || r.status === 'exists').length;
            alert(`İşlem tamamlandı. ${successCount} kullanıcı işlendi.`);

        } catch (err: any) {
            console.error('Import error:', err);
            setError('İçe aktarma sırasında sunucu hatası: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Üye Excel İçe Aktarma</h3>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={importing}
                            className="hidden"
                        />
                        <span className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-block">
                            Excel Dosyası Seç
                        </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                        .xlsx veya .xls dosyaları. Kolonlar: tckn, sicil_no, email, full_name
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Data Preview / Status */}
                {data.length > 0 && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-700">Bulunan Kayıtlar ({data.length})</h4>
                            <button
                                onClick={handleImport}
                                disabled={importing || data.every(d => d.status !== 'PENDING')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {importing ? 'İşleniyor...' : 'İçe Aktarmayı Başlat'}
                            </button>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Ad Soyad</th>
                                        <th className="px-4 py-2 text-left">E-posta</th>
                                        <th className="px-4 py-2 text-left">TCKN</th>
                                        <th className="px-4 py-2 text-left">Sicil No</th>
                                        <th className="px-4 py-2 text-left">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className={row.status === 'ERROR' ? 'bg-red-50' : row.status === 'SUCCESS' ? 'bg-green-50' : ''}>
                                            <td className="px-4 py-2">{row.full_name}</td>
                                            <td className="px-4 py-2">{row.email}</td>
                                            <td className="px-4 py-2">{row.tckn}</td>
                                            <td className="px-4 py-2">{row.sicil_no}</td>
                                            <td className="px-4 py-2">
                                                {row.status === 'PENDING' && <span className="text-gray-500">Bekliyor</span>}
                                                {row.status === 'SUCCESS' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Tamamlandı</span>}
                                                {row.status === 'ERROR' && <span className="text-red-600 flex items-center gap-1" title={row.message}><AlertCircle size={14} /> Hata</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
