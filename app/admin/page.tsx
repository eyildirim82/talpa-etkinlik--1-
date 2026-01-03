import React from 'react';
import { createServerClient } from '@/shared/infrastructure/supabase';
import { AlertCircle, CreditCard, Users, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  // Fetch Active Event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'ACTIVE')
    .maybeSingle();

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

  // Fetch Stats from bookings
  const { count: asilCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('queue_status', 'ASIL');

  const { count: yedekCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('queue_status', 'YEDEK');

  const { count: paidCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('payment_status', 'PAID');

  const asil = asilCount || 0;
  const yedek = yedekCount || 0;
  const paid = paidCount || 0;
  const totalBookings = asil + yedek;
  const totalQuota = (event.quota_asil || 0) + (event.quota_yedek || 0);
  const occupancy = totalQuota > 0 ? Math.round((totalBookings / totalQuota) * 100) : 0;
  const revenue = paid * (event.price || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-talpa-primary tracking-tight">OPERASYON ÖZETİ</h1>
        <p className="text-sm text-talpa-secondary font-mono mt-1">
          AKTİF SORTİ: <span className="text-talpa-accent font-bold">{event.title}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Card 1: Asil Bookings */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Asil Başvurular</span>
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {asil} <span className="text-lg text-talpa-secondary/50">/ {event.quota_asil || 0}</span>
          </div>
          <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-500"
              style={{ width: `${event.quota_asil > 0 ? Math.min((asil / event.quota_asil) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Yedek Bookings */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Yedek Başvurular</span>
            <Users className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {yedek} <span className="text-lg text-talpa-secondary/50">/ {event.quota_yedek || 0}</span>
          </div>
          <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
            <div
              className="bg-yellow-600 h-full transition-all duration-500"
              style={{ width: `${event.quota_yedek > 0 ? Math.min((yedek / event.quota_yedek) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Paid Bookings */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Bilet Gönderilen</span>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {paid}
          </div>
          <p className="text-xs text-talpa-secondary mt-4">
            Ödeme onayı alınan başvurular
          </p>
        </div>

        {/* Card 4: Revenue */}
        <div className="bg-white p-6 border border-talpa-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-talpa-secondary uppercase tracking-wider">Tahmini Hasılat</span>
            <CreditCard className="w-5 h-5 text-talpa-success" />
          </div>
          <div className="text-3xl font-mono font-bold text-talpa-primary">
            {revenue.toLocaleString('tr-TR')} <span className="text-sm text-talpa-secondary">₺</span>
          </div>
          <p className="text-xs text-talpa-secondary mt-4">
            Ödeme alınan başvurular
          </p>
        </div>
      </div>
    </div>
  );
}