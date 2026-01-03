import React from 'react';
import { EventData } from '../../../types';

// Cinematic Hero Section
export const CinematicHero = ({ event }: { event: EventData }) => {
    return (
        <section style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'hidden'
        }}>
            {/* Background Image */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0
            }}>
                <img
                    src={event.image_url}
                    alt={event.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.4)'
                    }}
                />
            </div>

            {/* Dark Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(10,25,41,0.3) 0%, rgba(10,25,41,0.8) 100%)',
                zIndex: 1
            }}></div>

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 2rem'
            }}>
                {/* Main Title - Serif */}
                <h1 style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 'clamp(3rem, 10vw, 8rem)',
                    fontWeight: '400',
                    color: '#D4AF37',
                    lineHeight: '1',
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.02em'
                }}>
                    {event.title.split(' ').slice(0, 2).join(' ')}
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    color: '#E5E5E5',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    marginBottom: '4rem',
                    opacity: 0.9
                }}>
                    TALPA Members Only
                </p>

                {/* Event Details - Editorial */}
                <div style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '1rem',
                    fontWeight: '300',
                    color: '#E5E5E5',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '3rem'
                }}>
                    {new Date(event.event_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short'
                    }).toUpperCase().replace('.', '')}
                    {' '}
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long'
                    }).toUpperCase()}
                    {' · '}
                    {event.location.split('-')[0].trim().toUpperCase()}
                    {' · '}
                    {new Date(event.event_date).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        style={{
                            background: 'transparent',
                            color: '#E5E5E5',
                            border: '2px solid #E5E5E5',
                            padding: '1rem 2.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            fontFamily: '"Inter", sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E5E5E5';
                            e.currentTarget.style.color = '#0A1929';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#E5E5E5';
                        }}
                    >
                        Detaylar
                    </button>

                    <button
                        onClick={() => alert('Üyelik işlemleri için lütfen TALPA ile iletişime geçiniz.')}
                        style={{
                            background: 'transparent',
                            color: '#D4AF37',
                            border: '2px solid #D4AF37',
                            padding: '1rem 2.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            fontFamily: '"Inter", sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#D4AF37';
                            e.currentTarget.style.color = '#0A1929';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#D4AF37';
                        }}
                    >
                        Üyelik
                    </button>
                </div>
            </div>
        </section>
    );
};
