import React from 'react';
import { EventData } from '../types';

interface EventCardProps {
    event: EventData;
    isFeatured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isFeatured = false }) => {
    // Format date in Turkish
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isSoldOut = event.remaining_stock === 0;

    return (
        <div
            className="event-card"
            style={isFeatured ? {
                border: '2px solid var(--talpa-pink)'
            } : {}}
        >
            <img
                src={event.image_url}
                alt={event.title}
                loading="lazy"
            />
            <div className="event-card-content" style={isFeatured ? { padding: '2rem' } : {}}>
                <h3 className="event-card-title" style={isFeatured ? { fontSize: '1.5rem', marginBottom: '1rem' } : {}}>
                    {event.title}
                </h3>
                {isFeatured && (
                    <p style={{
                        color: 'var(--talpa-text-primary)',
                        marginBottom: '1rem',
                        lineHeight: '1.6'
                    }}>
                        {event.description}
                    </p>
                )}
                <p className="event-card-date">Tarih: {formatDate(event.event_date)}</p>
                <p className="event-card-time">Saat: {formatTime(event.event_date)}</p>
                {isFeatured && (
                    <p style={{ margin: '0.75rem 0', color: 'var(--talpa-text-primary)' }}>
                        📍 {event.location}
                    </p>
                )}
                <p className="event-card-status text-danger" style={isFeatured ? { fontSize: '1.25rem', fontWeight: 'bold' } : {}}>
                    {isSoldOut ? 'BİLETLER TÜKENMİŞTİR.' : `${event.remaining_stock} / ${event.total_quota} KALAN`}
                </p>
                {isFeatured && !isSoldOut && (
                    <p style={{
                        marginTop: '1rem',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--talpa-purple)'
                    }}>
                        {event.price.toLocaleString('tr-TR')} {event.currency}
                    </p>
                )}
            </div>
        </div>
    );
};
