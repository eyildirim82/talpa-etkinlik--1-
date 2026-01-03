import React, { useState } from 'react';
import { BookingsTable } from './BookingsTable';
import { TicketPoolManager } from './TicketPoolManager';
import { getActiveEvent } from '@/modules/event/api/event.api';
import { useQuery } from '@tanstack/react-query';

export const TicketsPanel: React.FC = () => {
    const [view, setView] = useState<'bookings' | 'pool'>('bookings');

    const { data: activeEvent } = useQuery({
        queryKey: ['activeEvent'],
        queryFn: getActiveEvent
    });

    if (!activeEvent) {
        return (
            <div className="text-center p-8 text-slate-500">
                Aktif etkinlik bulunamadı. Lütfen önce etkinlik oluşturun.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Bilet ve Başvuru Yönetimi</h2>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex gap-1">
                    <button
                        onClick={() => setView('bookings')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'bookings'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Başvurular
                    </button>
                    <button
                        onClick={() => setView('pool')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'pool'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Bilet Havuzu
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
