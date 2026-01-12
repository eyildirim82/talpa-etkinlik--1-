import React from 'react'
import type { EventData } from '../types/event.types'

interface EventCardProps {
    event: EventData
    isFeatured?: boolean
}

export const EventCard: React.FC<EventCardProps> = ({ event, isFeatured = false }) => {
    // Format date in Turkish
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isSoldOut = event.remaining_stock === 0

    return (
        <div
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                isFeatured ? 'border-2 border-brand-pink p-0' : 'border border-ui-border'
            }`}
        >
            <img
                src={event.image_url || ''}
                alt={event.title}
                loading="lazy"
                className="w-full h-48 object-cover"
            />
            <div className={isFeatured ? 'p-8' : 'p-4'}>
                <h3 className={`font-bold text-text-primary ${isFeatured ? 'text-2xl mb-4' : 'text-xl mb-2'}`}>
                    {event.title}
                </h3>
                {isFeatured && (
                    <p className="text-text-primary mb-4 leading-relaxed">
                        {event.description}
                    </p>
                )}
                <p className="text-sm text-text-muted mb-1">Tarih: {formatDate(event.event_date)}</p>
                <p className="text-sm text-text-muted mb-2">Saat: {formatTime(event.event_date)}</p>
                {isFeatured && (
                    <p className="my-3 text-text-primary">
                        📍 {event.location}
                    </p>
                )}
                <p className={`font-bold ${isFeatured ? 'text-xl' : 'text-base'} ${isSoldOut ? 'text-state-error' : 'text-text-primary'}`}>
                    {isSoldOut ? 'BİLETLER TÜKENMİŞTİR.' : `${event.remaining_stock} / ${event.total_quota} KALAN`}
                </p>
                {isFeatured && !isSoldOut && (
                    <p className="mt-4 text-2xl font-bold text-brand-purple">
                        {event.price.toLocaleString('tr-TR')} {event.currency}
                    </p>
                )}
            </div>
        </div>
    )
}

