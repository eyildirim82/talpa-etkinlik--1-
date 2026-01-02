'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../utils/supabase/browser';
import { BookingsTable } from './BookingsTable';
import { AlertCircle } from 'lucide-react';

export const TicketsPanel: React.FC = () => {
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
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-talpa-primary border-t-transparent animate-spin rounded-full" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Aktif Etkinlik Yok</h3>
                <p className="text-sm text-gray-500">Etkinlik Yönetimi menüsünden bir etkinlik oluşturun veya aktif edin.</p>
            </div>
        );
    }

    return (
        <div className="bg-talpa-bg min-h-screen text-talpa-primary">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-talpa-gold mb-2">Başvurular</h2>
                <p className="text-sm text-talpa-secondary">Etkinlik: <span className="text-white">{event.title}</span></p>
            </div>
            <BookingsTable eventId={event.id} />
        </div>
    );
};

export default TicketsPanel;
