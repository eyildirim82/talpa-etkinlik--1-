import React from 'react';
import { createClient } from '../../../utils/supabase/server';
import { createEvent, setActiveEvent } from '../../../actions/admin';
import { Plus, Power } from 'lucide-react';

export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-talpa-primary tracking-tight">ETKİNLİK YÖNETİMİ</h1>
          <p className="text-sm text-talpa-secondary mt-1">Uçuş planlamalarını buradan yönetebilirsiniz.</p>
        </div>
      </div>

      {/* Create Event Form (Collapsible/Inline for speed) */}
      <div className="bg-white border border-talpa-border p-6 shadow-sm">
        <h3 className="text-sm font-bold text-talpa-primary uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
          Yeni Etkinlik Planla
        </h3>
        <form action={async (formData: FormData) => {
          'use server';
          await createEvent(formData);
        }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Başlık</label>
            <input name="title" required placeholder="Etkinlik Adı" className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Görsel URL</label>
            <input name="imageUrl" required placeholder="https://..." className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none" />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Tarih</label>
            <input type="date" name="date" required className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Saat</label>
            <input type="time" name="time" required className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Fiyat</label>
            <input type="number" name="price" required placeholder="0.00" className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-talpa-secondary uppercase">Kota</label>
            <input type="number" name="quota" required placeholder="150" className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none font-mono" />
          </div>
          <div className="md:col-span-4">
             <label className="text-[10px] font-bold text-talpa-secondary uppercase">Konum</label>
             <input name="location" required placeholder="Etkinlik Mekanı" className="w-full h-10 border border-talpa-border px-3 text-sm focus:border-talpa-accent outline-none" />
          </div>
          
          <div className="md:col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-talpa-primary text-white px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-talpa-accent transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Planı Oluştur
            </button>
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-talpa-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-talpa-border">
              <th className="p-4 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Durum</th>
              <th className="p-4 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Etkinlik</th>
              <th className="p-4 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Tarih</th>
              <th className="p-4 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider text-right">Kota</th>
              <th className="p-4 text-[10px] font-bold text-talpa-secondary uppercase tracking-wider text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events?.map((ev) => (
              <tr key={ev.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  {ev.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                      AKTİF
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wide">
                      PASİF
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-bold text-sm text-talpa-primary">{ev.title}</div>
                  <div className="text-xs text-talpa-secondary truncate max-w-xs">{ev.location}</div>
                </td>
                <td className="p-4 font-mono text-xs text-talpa-primary">
                  {new Date(ev.event_date).toLocaleDateString('tr-TR')}
                </td>
                <td className="p-4 font-mono text-xs text-talpa-primary text-right">
                  {ev.total_quota}
                </td>
                <td className="p-4 text-right">
                  {!ev.is_active && (
                    <form action={async () => {
                      'use server';
                      await setActiveEvent(ev.id);
                    }}>
                        <button type="submit" className="text-xs font-bold text-talpa-accent hover:text-talpa-primary underline uppercase tracking-wide flex items-center justify-end gap-1 ml-auto">
                            <Power className="w-3 h-3" />
                            Aktif Et
                        </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}