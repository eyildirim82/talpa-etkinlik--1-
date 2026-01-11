import React, { useState } from 'react';
import { BookingsTable } from './BookingsTable';
import { TicketPoolManager } from './TicketPoolManager';
import { getActiveEvent } from '@/modules/event';
import { useQuery } from '@tanstack/react-query';

export const TicketsPanel: React.FC = () => {
    const [view, setView] = useState<'bookings' | 'pool'>('bookings');

    const { data: activeEvent } = useQuery({
        queryKey: ['activeEvent'],
        queryFn: getActiveEvent
    });

    if (!activeEvent) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-text-muted bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-text-muted text-2xl">event_available</span>
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-1">Aktif Etkinlik Yok</h3>
                <p className="text-sm text-text-muted">İşlem yapmak için lütfen önce bir etkinlik oluşturun veya seçin.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-ui-border-subtle">
                <button
                    onClick={() => setView('bookings')}
                    className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${
                        view === 'bookings'
                            ? 'text-brand-primary'
                            : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Başvurular</span>
                    {view === 'bookings' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setView('pool')}
                    className={`pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${
                        view === 'pool'
                            ? 'text-brand-primary'
                            : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    <span>Bilet Havuzu</span>
                    {view === 'pool' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full" />
                    )}
                </button>
            </div>

            {view === 'bookings' ? (
                <BookingsTable eventId={Number(activeEvent.id)} />
            ) : (
                <TicketPoolManager eventId={Number(activeEvent.id)} />
            )}
        </div>
    );
};
