import React from 'react';
import { EventData } from '@/types';

// Sticky Footer CTA - LUXE Design
export const StickyFooter = ({ event, onJoin }: { event: EventData; onJoin?: () => void }) => {

    return (
        <div
            id="sticky-footer"
            className="fixed bottom-0 left-0 w-full z-40 bg-ui-surface/95 backdrop-blur border-t border-ui-border py-4 px-6 md:px-12 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]"
        >
            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Event Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div 
                        className="hidden sm:block size-10 rounded bg-cover bg-center grayscale [background-image:var(--footer-event-image)]"
                        style={{ '--footer-event-image': `url('${event.image_url}')` } as React.CSSProperties & { '--footer-event-image': string }}
                    />
                    <div className="text-left">
                        <p className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold mb-0.5">
                            Şu Anda Devam Ediyor
                        </p>
                        <p className="text-text-primary font-sans text-body-sm md:text-body font-medium">
                            {event.title}
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={event.remaining_stock === 0 ? undefined : (onJoin ? onJoin : () => alert('Bilet almak için lütfen giriş yapınız.'))}
                    disabled={event.remaining_stock === 0}
                    className="w-full sm:w-auto bg-brand-primary text-white text-xs font-semibold uppercase tracking-wider h-10 px-8 rounded-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>{event.remaining_stock === 0 ? 'TÜKENDİ' : 'Hızlı Rezervasyon'}</span>
                </button>
            </div>
        </div>
    );
};
