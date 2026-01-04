import React from 'react';
import { EventData } from '../../../types';
import { Button } from '../common/Button';

// Sticky Footer CTA
export const StickyFooter = ({ event, onJoin }: { event: EventData; onJoin?: () => void }) => {
    // Debugging: Always render and log event
    console.log('[StickyFooter] Rendering with event:', event);
    // if (!event || event.remaining_stock === 0) return null;

    return (
        <div
            id="sticky-footer"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 9999,
                background: 'rgba(10, 25, 41, 0.98)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '2px solid #D4AF37',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
                padding: '1.5rem 3rem',
                display: 'block',
                visibility: 'visible',
                opacity: 1
            }}
        >
            <div style={{
                maxWidth: '1600px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Event Info */}
                <div>
                    <div style={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#E5E5E5',
                        marginBottom: '0.25rem'
                    }}>
                        {event.title}
                    </div>
                    <div style={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: '400',
                        color: '#D4AF37',
                        letterSpacing: '0.05em'
                    }}>
                        {event.remaining_stock} / {event.total_quota} Kalan · {event.price.toLocaleString('tr-TR')} {event.currency}
                    </div>
                </div>

                {/* CTA Button */}
                <Button
                    variant="secondary"
                    size="lg"
                    disabled={event.remaining_stock === 0}
                    onClick={event.remaining_stock === 0 ? undefined : (onJoin ? onJoin : () => alert('Bilet almak için lütfen giriş yapınız.'))}
                >
                    {event.remaining_stock === 0 ? 'TÜKENDİ' : 'Bilet Al'}
                </Button>
            </div>
        </div>
    );
};
