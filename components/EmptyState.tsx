import React from 'react';
import { Plane, Radio, AlertTriangle } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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
          <h1 className="text-xl font-mono font-bold text-talpa-primary tracking-widest uppercase">
            NO ACTIVE SORTIES
          </h1>
          <div className="flex items-center justify-center gap-2 text-talpa-secondary">
             <Radio className="w-4 h-4" />
             <p className="text-sm font-medium">RADAR CLEAR</p>
          </div>
          <p className="text-sm text-talpa-secondary/70 mt-4 max-w-xs mx-auto leading-relaxed">
            Şu anda planlanmış aktif bir etkinlik veya uçuş bulunmamaktadır. Lütfen daha sonra tekrar kontrol ediniz.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-md">
           <div className="w-2 h-2 bg-talpa-danger rounded-full animate-pulse"></div>
           <span className="text-xs font-mono font-semibold text-talpa-secondary">SYSTEM STANDBY</span>
        </div>

      </div>
    </div>
  );
};