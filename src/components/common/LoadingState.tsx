import React from 'react';

// Loading component - Dark Mode
export const LoadingState = () => (
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
