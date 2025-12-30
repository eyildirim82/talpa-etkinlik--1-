import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { EmptyState } from './components/EmptyState';
import { AuthModal } from './components/AuthModal';
import { loadMockData } from './mockData';
import { EventData, User } from './types';

// Loading component - Dark Mode
const LoadingState = () => (
  <div style={{
    minHeight: '100vh',
    background: '#0A1929',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        border: '2px solid rgba(212,175,55,0.2)',
        borderTop: '2px solid #D4AF37',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p style={{
        fontSize: '0.75rem',
        fontWeight: '400',
        letterSpacing: '0.2em',
        color: '#D4AF37',
        textTransform: 'uppercase'
      }}>Loading...</p>
    </div>
  </div>
);

// Luxury Navigation Header
const LuxuryHeader = ({ user, onAuthClick }: { user: User | null; onAuthClick: () => void }) => (
  <header style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'rgba(10, 25, 41, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(229, 229, 229, 0.1)',
    padding: '1.5rem 3rem'
  }}>
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: '2rem'
    }}>
      {/* Left Navigation */}
      <nav style={{
        display: 'flex',
        gap: '2rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        <a href="#" style={{ color: '#E5E5E5', textDecoration: 'none', transition: 'color 0.3s' }}>
          Etkinlikler
        </a>
        <button
          onClick={onAuthClick}
          style={{
            color: user ? '#D4AF37' : '#E5E5E5',
            textDecoration: 'none',
            transition: 'color 0.3s',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          {user ? 'Hesabım' : 'Giriş Yap'}
        </button>
      </nav>

      {/* Centered Logo */}
      <div style={{ textAlign: 'center' }}>
        <img
          src="/Logo.png"
          alt="TALPA"
          style={{ height: '80px', width: 'auto' }}
        />
      </div>

      {/* Right Navigation */}
      <nav style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'flex-end',
        alignItems: 'center',
        fontSize: '0.75rem',
        fontWeight: '500',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        {user && (
          <span style={{ color: '#D4AF37' }}>{user.full_name}</span>
        )}
        <button style={{
          background: '#C41E3A',
          color: '#FFFFFF',
          border: 'none',
          padding: '0.75rem 2rem',
          borderRadius: '2px',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#A01729'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#C41E3A'}
        >
          İletişim
        </button>
      </nav>
    </div>
  </header>
);

// Cinematic Hero Section
const CinematicHero = ({ event }: { event: EventData }) => {
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
          <button style={{
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

          <button style={{
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

// Sticky Footer CTA
const StickyFooter = ({ event }: { event: EventData }) => {
  if (!event || event.remaining_stock === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(10, 25, 41, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)',
      padding: '1.5rem 3rem'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
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
        <button style={{
          background: '#D4AF37',
          color: '#0A1929',
          border: 'none',
          padding: '1rem 3rem',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.3s',
          fontFamily: '"Inter", sans-serif'
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#E5C158'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#D4AF37'}
        >
          Bilet Al
        </button>
      </div>
    </div>
  );
};

// Main wrapper component
const AppWrapper = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Import Supabase client
        const { createClient } = await import('./utils/supabase/browser');
        const supabase = createClient();

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser(profile);
          }
        }

        // Fetch active event from view
        const { data: activeEvent } = await supabase
          .from('active_event_view')
          .select('*')
          .maybeSingle();

        if (activeEvent) {
          setEvents([activeEvent]);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('[AppWrapper] Error loading data:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1929' }}>
        <LuxuryHeader user={user} onAuthClick={() => setShowAuthModal(true)} />
        <EmptyState />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  const activeEvent = events.find(event => event.remaining_stock > 0);

  if (!activeEvent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0A1929',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", sans-serif'
      }}>
        <p style={{ fontSize: '1.5rem', color: '#E5E5E5' }}>Aktif etkinlik bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1929' }}>
      <LuxuryHeader user={user} onAuthClick={() => setShowAuthModal(true)} />
      <CinematicHero event={activeEvent} />
      <StickyFooter event={activeEvent} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

// Add keyframes for loading animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
document.head.appendChild(style);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);