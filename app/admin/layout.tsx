import React from 'react';
import { createServerClient } from '@/shared/infrastructure/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Users, LogOut, Plane } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-talpa-primary text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Plane className="w-6 h-6 mr-2 text-talpa-accent" />
          <span className="text-lg font-bold tracking-widest">TALPA OPS</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-white/10 rounded-sm transition-colors text-white/80 hover:text-white">
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </Link>
          <Link href="/admin/events" className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-white/10 rounded-sm transition-colors text-white/80 hover:text-white">
            <Calendar className="w-4 h-4" />
            ETKİNLİK YÖNETİMİ
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-white/10 rounded-sm transition-colors text-white/80 hover:text-white">
            <Users className="w-4 h-4" />
            YOLCU LİSTESİ
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-xs font-mono text-white/50 hover:text-white transition-colors">
            &larr; UYGULAMAYA DÖN
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}