import React from 'react';
import { createClient } from '../../utils/supabase/server';
import { AlertCircle, CreditCard, Users, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch Active Event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full text-talpa-secondary">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Aktif Etkinlik Yok</h2>
          <p className="text-sm">Etkinlik Yönetimi menüsünden bir etkinlik oluşturun veya aktif edin.</p>
        </div>
      </div>
    );
  }

  // Fetch Stats
  const { count: soldCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .neq('status', 'cancelled');

  const sold = soldCount || 0;
  const total = event.total_quota;
  const occupancy = Math.round((sold / total) * 100);
  const revenue = sold * event.price;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-talpa-primary tracking-tight">OPERASYON ÖZETİ</h1>
        <p className="text-sm text-talpa-secondary font-mono mt-1">
          AKTİF SORTİ: <span className="text-talpa-accent font-bold">{event.title}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Sales */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Doluluk</span>
            <Users className="w-5 h-5 text-talpa-accent" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {sold} <span className="text-lg text-talpa-secondary/50">/ {total}</span>
          </div>
          <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
            <div
              className="bg-talpa-accent h-full transition-all duration-500"
              style={{ width: `${occupancy}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Tahmini Hasılat</span>
            <CreditCard className="w-5 h-5 text-talpa-success" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {revenue.toLocaleString('tr-TR')} <span className="text-sm text-talpa-secondary">{event.currency}</span>
          </div>
          <p className="text-xs text-talpa-secondary mt-4">
            * İptaller hariç net tutar.
          </p>
        </div>

        {/* Card 3: Status */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Durum</span>
            <TrendingUp className="w-5 h-5 text-talpa-warning" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            %{occupancy}
          </div>
          <p className="text-xs text-talpa-success mt-4 font-bold">
            SATIŞLAR DEVAM EDİYOR
          </p>
        </div>
      </div>
    </div>
  );
}