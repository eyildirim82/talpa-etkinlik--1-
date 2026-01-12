import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 pt-24">
      <div className="max-w-md w-full text-center">
        {/* Minimal Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <div className="w-20 h-20 border-2 border-ui-border rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border border-ui-border rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-ui-border rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-2xl font-sans font-light text-text-primary tracking-tight">
            Aktif Etkinlik Yok
          </h1>
          <p className="text-sm text-text-secondary font-light leading-relaxed max-w-xs mx-auto">
            Şu anda planlanmış aktif bir etkinlik bulunmamaktadır. Lütfen daha sonra tekrar kontrol ediniz.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-ui-background border border-ui-border rounded-sm">
          <div className="w-2 h-2 bg-text-secondary rounded-full"></div>
          <span className="text-xs font-sans font-medium text-text-secondary uppercase tracking-wider">
            Beklemede
          </span>
        </div>
      </div>
    </div>
  );
};
