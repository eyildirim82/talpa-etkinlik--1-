import React from 'react';
import { EventData } from '@/types';

// Cinematic Hero Section - LUXE Design
export const CinematicHero = ({ event }: { event: EventData }) => {
    const formatLocation = (loc: string) => {
        if (!loc) return '';
        if (loc.startsWith('http') || loc.length > 50) {
            return 'KONUM BİLGİSİ';
        }
        return loc.split('-')[0].trim().toUpperCase();
    };

    const handleReserveSeat = () => {
        // Scroll to footer or trigger booking
        const footer = document.getElementById('sticky-footer');
        if (footer) {
            footer.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleWatchTrailer = () => {
        alert('Video önizlemesi yakında...');
    };

    return (
        <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden pt-16 pb-24">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105 [background-image:var(--hero-bg-image)]"
                    style={{ '--hero-bg-image': `url('${event.image_url}')` } as React.CSSProperties & { '--hero-bg-image': string }}
                />
            </div>
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 z-10"></div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12 text-center flex flex-col items-center justify-center gap-6">
                {/* Featured Event Badge */}
                <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-2xs font-semibold tracking-[0.3em] text-white uppercase mb-2">
                    Öne Çıkan Etkinlik
                </span>

                {/* Main Title - Minimal & Serious */}
                <h1 className="text-display-2 md:text-display-1 lg:text-display-3 font-sans font-light text-white leading-tight tracking-tight text-shadow-hero">
                    {event.title}
                </h1>

                {/* Description */}
                <p className="text-white/90 text-body md:text-body-lg font-light font-sans tracking-normal max-w-xl mx-auto leading-relaxed text-shadow-hero">
                    {event.description || 'Özel erişim ve seçkin deneyimler. Lüksün doruk noktası.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={handleReserveSeat}
                        className="bg-white text-black h-12 px-8 rounded-sm font-medium text-sm uppercase tracking-wider transition-all duration-300 hover:bg-ui-background flex items-center justify-center gap-2"
                    >
                        <span>Rezervasyon Yap</span>
                    </button>
                    <button
                        onClick={handleWatchTrailer}
                        className="bg-transparent border border-white text-white h-12 px-8 rounded-sm font-medium text-sm uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-black flex items-center justify-center gap-2"
                    >
                        <span>Fragman İzle</span>
                    </button>
                </div>
            </div>
        </section>
    );
};
