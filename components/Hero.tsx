import React from 'react';
import { useApp } from '../contexts/AppContext';

export const Hero: React.FC = () => {
  const { event } = useApp();

  // Status mapping based on boolean is_active
  const statusText = event.is_active ? 'SATIŞTA' : 'SATIŞA KAPALI';
  const statusColor = event.is_active ? 'bg-talpa-success' : 'bg-talpa-danger';

  return (
    <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-100 overflow-hidden rounded-t-xl">
      {/* Background Image */}
      <img 
        src={event.image_url} 
        alt={event.title} 
        className="w-full h-full object-cover"
      />
      
      {/* Soft Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-talpa-primary/90 via-talpa-primary/20 to-transparent" />

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