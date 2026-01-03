import React from 'react';
import { EventData } from '../types';
import { EventCard } from '@/modules/event';

interface EventGridProps {
    events: EventData[];
}

export const EventGrid: React.FC<EventGridProps> = ({ events }) => {
    if (!events || events.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ color: 'var(--talpa-text-secondary)', fontSize: '1.125rem' }}>
                    Henüz etkinlik bulunmamaktadır.
                </p>
            </div>
        );
    }

    // Aktif ve geçmiş etkinlikleri ayır
    const activeEvent = events.find(event => event.remaining_stock > 0);
    const pastEvents = events.filter(event => event.remaining_stock === 0);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Aktif Etkinlik - Büyük ve Ortada */}
            {activeEvent && (
                <div style={{ marginBottom: '4rem' }}>
                    <h2 style={{
                        textAlign: 'center',
                        color: 'var(--talpa-purple)',
                        fontSize: '2rem',
                        marginBottom: '2rem',
                        fontFamily: '"Barlow Condensed", sans-serif'
                    }}>
                        Aktif Etkinlik
                    </h2>
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease'
                    }}>
                        <EventCard event={activeEvent} isFeatured={true} />
                    </div>
                </div>
            )}

            {/* Geçmiş Etkinlikler - Küçük Grid */}
            {pastEvents.length > 0 && (
                <div>
                    <h2 style={{
                        textAlign: 'center',
                        color: 'var(--talpa-text-secondary)',
                        fontSize: '1.5rem',
                        marginBottom: '2rem',
                        fontFamily: '"Barlow Condensed", sans-serif'
                    }}>
                        Geçmiş Etkinlikler
                    </h2>
                    <div className="event-grid">
                        {pastEvents.map(event => (
                            <EventCard key={event.id} event={event} isFeatured={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
