import React from 'react';
import { createClient } from '../../../utils/supabase/server';
import { Download, AlertCircle } from 'lucide-react';

export default async function TicketsPage() {
  const supabase = createClient();

  // 1. Get Active Event
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('is_active', true)
    .single();

  if (!event) {
     return (
        <div className="p-12 text-center text-talpa-secondary">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Aktif etkinlik bulunamadı.
        </div>
     );
  }

  // 2. Get Tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
        id,
        seat_number,
        status,
        purchase_date,
        profiles (
            full_name,
            talpa_sicil_no,
            phone
        )
    `)
    .eq('event_id', event.id)
    .order('purchase_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-talpa-primary tracking-tight">YOLCU MANİFESTOSU</h1>
          <p className="text-sm text-talpa-secondary font-mono mt-1">
            ETKİNLİK: {event.title}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-talpa-border text-talpa-primary text-xs font-bold uppercase tracking-wider hover:bg-gray-50 shadow-sm">
            <Download className="w-4 h-4" />
            Excel İndir
        </button>
      </div>

      <div className="bg-white border border-talpa-border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-talpa-border">
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider w-12">#</th>
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Yolcu Adı</th>
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Sicil No</th>
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Telefon</th>
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Tarih</th>
                    <th className="p-3 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider text-right">Durum</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {tickets?.map((ticket: any, index: number) => (
                    <tr key={ticket.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-xs text-gray-400">{index + 1}</td>
                        <td className="p-3 text-sm font-bold text-talpa-primary uppercase">{ticket.profiles?.full_name}</td>
                        <td className="p-3 font-mono text-xs text-talpa-primary">{ticket.profiles?.talpa_sicil_no}</td>
                        <td className="p-3 font-mono text-xs text-talpa-secondary">{ticket.profiles?.phone || '-'}</td>
                        <td className="p-3 font-mono text-xs text-talpa-secondary">
                            {new Date(ticket.purchase_date).toLocaleString('tr-TR')}
                        </td>
                        <td className="p-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100">
                                {ticket.status}
                            </span>
                        </td>
                    </tr>
                ))}
                {tickets?.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-sm text-talpa-secondary">
                            Henüz bilet satışı yapılmamış.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}