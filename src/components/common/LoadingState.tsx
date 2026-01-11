import React from 'react';

// Loading component - Minimal Design
export const LoadingState = () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-sans font-medium text-secondary uppercase tracking-wider">
                Yükleniyor...
            </p>
        </div>
    </div>
);
