import React from 'react';
import { createClient } from '../../../utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { QrCode, Plane, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get Current User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  // 2. Fetch Ticket with Event Details
  // Using explicit join via supabase query syntax
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events (
        title,
        event_date,
        location,
        image_url
      ),
      profiles (
        full_name,
        talpa_sicil_no
      )
    `)
    .eq('id', id)
    .single();

  if (error || !ticket) {
    notFound();
  }

  // 3. Security Check: Is this MY ticket?
  if (ticket.user_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <AlertTriangle className="w-12 h-12 text-talpa-danger mb-4" />
        <h1 className="text-xl font-bold text-talpa-primary">Erişim Engellendi</h1>
        <p className="text-talpa-secondary mt-2">Bu bileti görüntüleme yetkiniz yok.</p>
        <Link href="/" className="mt-6 px-6 py-3 bg-talpa-primary text-white font-mono text-sm uppercase">
          Anasayfaya Dön
        </Link>
      </div>
    );
  }

  // Format Data
  const event = ticket.events; // Typescript assumes array usually, but .single() makes it object if relation is 1:1 correctly mapped or handled dynamically
  const profile = ticket.profiles;

  // Safe Date Parsing
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-md w-full">

        {/* Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-xs font-bold text-talpa-secondary hover:text-talpa-primary uppercase tracking-widest flex items-center gap-2">
            &larr; Flight Deck
          </Link>
          <span className="px-2 py-1 bg-talpa-success/10 text-talpa-success text-[10px] font-bold border border-talpa-success/20 rounded-sm">
            CONFIRMED
          </span>
        </div>

        {/* Boarding Pass Container */}
        <div className="bg-white shadow-xl overflow-hidden relative">

          {/* Top Cutout Visuals (CSS Tricks) */}
          <div className="absolute -left-3 top-2/3 w-6 h-6 bg-gray-100 rounded-full z-10"></div>
          <div className="absolute -right-3 top-2/3 w-6 h-6 bg-gray-100 rounded-full z-10"></div>

          {/* 1. Header Section */}
          <div className="bg-talpa-primary p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <Plane className="w-6 h-6 opacity-50" />
                <span className="font-mono text-xs opacity-50 tracking-widest">TALPA PASS</span>
              </div>
              <h1 className="text-xl font-bold leading-tight mb-1">{event.title}</h1>
              <p className="text-white/60 text-xs font-mono">{event.location}</p>
            </div>
            {/* Decorative BG */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          </div>

          {/* 2. Info Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Date</span>
                <span className="font-mono text-base font-bold text-talpa-primary">{dateStr}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Time (Local)</span>
                <span className="font-mono text-base font-bold text-talpa-primary">{timeStr}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Passenger</span>
                <span className="font-sans text-sm font-bold text-talpa-primary truncate uppercase">{profile.full_name}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Sicil No</span>
                <span className="font-mono text-sm font-bold text-talpa-primary">{profile.talpa_sicil_no}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-gray-200 w-full my-0 relative"></div>

          {/* 3. QR Section */}
          <div className="p-8 flex flex-col items-center justify-center bg-gray-50/50">
            <div className="bg-white p-3 border border-gray-200 rounded-lg mb-4">
              <QrCode className="w-40 h-40 text-talpa-primary" strokeWidth={1} />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-mono mb-1">{ticket.id.split('-')[0].toUpperCase()}</p>
              <p className="text-[10px] text-talpa-secondary uppercase font-bold tracking-wide">
                Seat Assignment at Gate
              </p>
            </div>
          </div>

          {/* 4. Footer Action */}
          <div className="bg-gray-50 p-4 border-t border-gray-100">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 shadow-sm text-talpa-primary text-xs font-bold uppercase tracking-wider hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4" />
              Save to Gallery
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 max-w-xs mx-auto">
          This digital pass serves as your entry ticket. Please present it at the welcome desk.
        </p>

      </div>
    </div>
  );
}