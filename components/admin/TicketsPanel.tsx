'use client'

import React, { useState } from 'react';
import { useActiveEvent } from '@/modules/event';
import { BookingsTable } from './BookingsTable';
import { TicketPoolManager } from './TicketPoolManager';
import { AlertCircle, Tickets, Users } from 'lucide-react';

export const TicketsPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'bookings' | 'pool'>('bookings');

    // Get Active Event
    const { data: eventData, isLoading } = useActiveEvent();
    const event = eventData ? { id: typeof eventData.id === 'string' ? parseInt(eventData.id) : eventData.id, title: eventData.title } : null;

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
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-talpa-gold mb-1">Bilet ve Başvuru Yönetimi</h2>
                    <p className="text-sm text-talpa-secondary">Etkinlik: <span className="text-white">{event.title}</span></p>
                </div>

                <div className="bg-talpa-card border border-talpa-border/50 p-1 rounded-lg flex items-center shadow-lg shadow-black/20">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bookings'
                                ? 'bg-talpa-gold/10 text-talpa-gold shadow-sm border border-talpa-gold/20'
                                : 'text-talpa-secondary hover:text-talpa-primary hover:bg-white/5'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Başvurular
                    </button>
                    <div className="w-px h-4 bg-talpa-border/50 mx-1"></div>
                    <button
                        onClick={() => setActiveTab('pool')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pool'
                                ? 'bg-talpa-gold/10 text-talpa-gold shadow-sm border border-talpa-gold/20'
                                : 'text-talpa-secondary hover:text-talpa-primary hover:bg-white/5'
                            }`}
                    >
                        <Tickets className="w-4 h-4" />
                        Bilet Havuzu
                    </button>
                </div>
            </div>

            {activeTab === 'bookings' ? (
                <BookingsTable eventId={event.id} />
            ) : (
                <TicketPoolManager eventId={event.id} />
            )}
        </div>
    );
};

export default TicketsPanel;
