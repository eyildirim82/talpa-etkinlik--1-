import React from 'react';
import { useApp } from '../contexts/AppContext';

interface HeroProps {
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ isLoading = false }) => {
  const { event } = useApp();

  if (isLoading) {
    return (
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-200 overflow-hidden rounded-t-xl animate-pulse">
        {/* Skeleton for Status Badge */}
        <div className="absolute top-6 right-6 z-10">
          <div className="w-24 h-8 bg-gray-300 rounded-full"></div>
        </div>

        {/* Skeleton for Title */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="w-32 h-6 bg-gray-300 rounded mb-4"></div>
            <div className="w-3/4 h-12 bg-gray-300 rounded mb-2"></div>
            <div className="w-1/2 h-12 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  // Status mapping based on remaining stock (kontenjan durumu)
  const remainingStock = event.remaining_stock || 0;
  let statusText: string;
  let statusColor: string;

  if (remainingStock <= 0) {
    statusText = 'KONTENJAN DOLU';
    statusColor = 'bg-talpa-danger';
  } else if (remainingStock <= 20) {
    statusText = 'DOLMAK ÜZERE';
    statusColor = 'bg-yellow-500';
  } else {
    statusText = 'BAŞVURUYA AÇIK';
    statusColor = 'bg-talpa-success';
  }

  return (
    <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-100 overflow-hidden rounded-t-xl">
      {/* Background Image */}
      <img
        src={event.image_url || ''}
        alt={event.title}
        className="w-full h-full object-cover"
      />

      {/* Soft Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Modern Status Badge */}
      <div className="absolute top-6 right-6">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
          <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
          <span className="text-xs font-semibold text-talpa-primary tracking-wide">
            {statusText}
          </span>
        </div>
      </div>

      {/* Event Title */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-md bg-white/10 text-white backdrop-blur-sm text-xs font-medium mb-3 border border-white/20">
            TALPA ÖZEL ETKİNLİK
          </span>
          <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>
      </div>
    </div>
  );
};