import React, { useState } from 'react';
import { BookingsTable } from './BookingsTable';
import { TicketPoolManager } from './TicketPoolManager';
import { getActiveEvent } from '@/modules/event';
import { useQuery } from '@tanstack/react-query';
import { Calendar, User, Ticket } from 'lucide-react';

export const TicketsPanel: React.FC = () => {
    const [view, setView] = useState<'bookings' | 'pool'>('bookings');

    const { data: activeEvent } = useQuery({
        queryKey: ['activeEvent'],
        queryFn: getActiveEvent
    });

    if (!activeEvent) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">Aktif Etkinlik Yok</h3>
                <p className="text-sm">İşlem yapmak için lütfen önce bir etkinlik oluşturun veya seçin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Bilet ve Başvuru Yönetimi</h2>
                    <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        Etkinlik: <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs font-mono">{activeEvent.id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 border-b border-slate-800 w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setView('bookings')}
                        className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${view === 'bookings'
                            ? 'text-amber-500'
                            : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Başvurular
                        </span>
                        {view === 'bookings' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setView('pool')}
                        className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${view === 'pool'
                            ? 'text-amber-500'
                            : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Ticket className="w-4 h-4" />
                            Bilet Havuzu
                        </span>
                        {view === 'pool' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {view === 'bookings' ? (
                <BookingsTable eventId={Number(activeEvent.id)} />
            ) : (
                <TicketPoolManager eventId={Number(activeEvent.id)} />
            )}
        </div>
    );
};
