'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { useActiveEvent } from '@/modules/event';
import { AlertCircle } from 'lucide-react';
import { BookingsTable } from '../../../components/admin/BookingsTable';

export default function TicketsPage() {
  // Get Active Event
  const { data: eventData, isLoading } = useActiveEvent();
  const event = eventData ? { id: typeof eventData.id === 'string' ? parseInt(eventData.id) : eventData.id, title: eventData.title } : null;

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
    <div className="min-h-screen bg-gradient-to-br from-talpa-bg via-talpa-bg to-[#0d1f35] p-6 md:p-8 lg:p-10">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-talpa-gold/5 via-transparent to-transparent rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-talpa-card/80 to-talpa-card/40 backdrop-blur-xl border border-talpa-border/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-talpa-gold via-yellow-400 to-talpa-gold tracking-tight mb-2">
                  BAŞVURULAR
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-talpa-gold to-transparent rounded-full"></div>
                  <p className="text-base md:text-lg text-talpa-secondary font-medium">
                    Etkinlik: <span className="text-talpa-gold font-semibold">{event.title}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {event && <BookingsTable eventId={event.id} />}
      </div>
    </div>
  );
}