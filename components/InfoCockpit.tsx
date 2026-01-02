import React from 'react';
import { useApp } from '../contexts/AppContext';
import { InstrumentBox } from './ui/InstrumentBox';
import { MapPin } from 'lucide-react';

export const InfoCockpit: React.FC = () => {
  const { event } = useApp();

  if (!event) return null;

  // Format Date from ISO String
  const dateObj = new Date(event.event_date);
  const dateFormatted = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormatted = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  // Mock Duration (In real DB, this could be a calculated field or separate column)
  const duration = "4 Saat";

  // Get location URL - prefer location_url, fallback to location for Google Maps search
  const locationUrl = (event as any).location_url || 
    (event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : null);

  return (
    <div className="w-full bg-white border-b border-talpa-border">
      <div className="max-w-4xl mx-auto">
        {/* Clean Grid with Dividers */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-talpa-border border-b border-talpa-border">

          {/* Date */}
          <div className="col-span-1">
            <InstrumentBox
              label="Tarih"
              value={<div className="flex items-center gap-2">{dateFormatted}</div>}
            />
          </div>

          {/* Time */}
          <div className="col-span-1">
            <InstrumentBox
              label="Saat"
              value={timeFormatted}
            />
          </div>

          {/* Location */}
          <div className="col-span-2 md:col-span-1">
            <InstrumentBox
              label="Konum"
              value={
                locationUrl ? (
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-base hover:text-talpa-primary transition-colors truncate"
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </a>
                ) : (
                  <div className="truncate text-base">{event.location}</div>
                )
              }
            />
          </div>

          {/* Duration */}
          <div className="col-span-2 md:col-span-1">
            <InstrumentBox
              label="Süre"
              value={duration}
            />
          </div>
        </div>

        {/* Description Row */}
        {event.description && (
          <div className="grid grid-cols-1 border-b border-talpa-border">
            <InstrumentBox
              className="py-6"
              label="Açıklama"
              value={
                <p className="text-sm text-talpa-text-secondary leading-relaxed">
                  {event.description}
                </p>
              }
            />
          </div>
        )}

        {/* Price Row */}
        <div className="grid grid-cols-1">
          <InstrumentBox
            className="md:flex-row md:items-center py-8"
            label="Bilet Fiyatı"
            value={
              <span className="text-3xl font-bold text-talpa-primary tracking-tight">
                {event.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {event.currency}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
};