'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../../utils/supabase/browser';
import { AlertCircle } from 'lucide-react';
import { BookingsTable } from '../../../components/admin/BookingsTable';

export default function TicketsPage() {
  const supabase = createClient();

  // Get Active Event
  const { data: event, isLoading } = useQuery({
    queryKey: ['activeEvent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-talpa-secondary">
        <div className="w-8 h-8 border-2 border-talpa-primary border-t-transparent animate-spin rounded-full mx-auto mb-2" />
        Yükleniyor...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center text-talpa-secondary">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        Aktif etkinlik bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-talpa-primary tracking-tight">BAŞVURULAR</h1>
        <p className="text-sm text-talpa-secondary font-mono mt-1">
          ETKİNLİK: {event.title}
        </p>
      </div>

      <BookingsTable eventId={event.id} />
    </div>
  );
}