import React from 'react';
import { Plane, Radio, AlertTriangle } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0A1929', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="max-w-md w-full text-center">

        {/* Radar Icon Animation */}
        <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-talpa-border/40 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 border-2 border-talpa-border rounded-full"></div>
          <div className="w-24 h-24 bg-talpa-border/10 rounded-full flex items-center justify-center relative overflow-hidden">
            {/* Scanning Line */}
            <div className="absolute w-full h-[2px] bg-talpa-secondary/30 top-1/2 left-0 animate-[spin_3s_linear_infinite] origin-center shadow-[0_0_10px_rgba(0,0,0,0.1)]"></div>
            <Plane className="w-10 h-10 text-talpa-secondary/50" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            NO ACTIVE SORTIES
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#E5E5E5' }}>
            <Radio className="w-4 h-4" />
            <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>RADAR CLEAR</p>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'rgba(229, 229, 229, 0.7)', marginTop: '1rem', maxWidth: '20rem', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
            Şu anda planlanmış aktif bir etkinlik veya uçuş bulunmamaktadır. Lütfen daha sonra tekrar kontrol ediniz.
          </p>
        </div>

        {/* Status Indicator */}
        <div style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(229,229,229,0.1)', border: '1px solid rgba(229,229,229,0.2)', borderRadius: '0.375rem' }}>
          <div style={{ width: '0.5rem', height: '0.5rem', background: '#C41E3A', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: '600', color: '#E5E5E5' }}>SYSTEM STANDBY</span>
        </div>

      </div>
    </div>
  );
};