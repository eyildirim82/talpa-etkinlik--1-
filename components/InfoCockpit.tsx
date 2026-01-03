import React from 'react';
import { useApp } from '../contexts/AppContext';
import { InstrumentBox } from './ui/InstrumentBox';
import { MapPin } from 'lucide-react';

export const InfoCockpit: React.FC = () => {
  const { event } = useApp();

  if (!event) return null;

  // Format Date from ISO String
  const dateObj = new Date(event.event_date);
  // Kısa tarih formatı: "16 Ocak" (gün ve ay)
  const dateFormatted = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  const timeFormatted = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  // Mock Duration (In real DB, this could be a calculated field or separate column)
  const duration = "4 Saat";

  // Get location URL - prefer location_url, fallback to location for Google Maps search
  const locationUrl = (event as any).location_url || 
    (event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : null);
  
  // Konum adını temizle - URL ise sadece okunabilir kısmı göster
  const getLocationDisplayName = (location: string | null | undefined): string => {
    if (!location) return '';
    
    // Eğer tam URL ise, sadece yer adını çıkar
    if (location.toLowerCase().startsWith('http')) {
      try {
        // Google Maps URL'lerinden yer adını çıkarmaya çalış
        // Örnek: /place/UFUK+HALISAHA+SPOR+SA%C4%9FL%C4%B1KT%C4%B1R/...
        const placeMatch = location.match(/\/place\/([^/@?]+)/i);
        if (placeMatch) {
          const placeName = decodeURIComponent(placeMatch[1])
            .replace(/\+/g, ' ')
            .replace(/%20/g, ' ')
            .trim();
          return placeName.length > 50 ? placeName.substring(0, 47) + '...' : placeName;
        }
        
        // Search query'den al
        const searchMatch = location.match(/[?&]query=([^&]+)/i);
        if (searchMatch) {
          const queryName = decodeURIComponent(searchMatch[1])
            .replace(/\+/g, ' ')
            .trim();
          return queryName.length > 50 ? queryName.substring(0, 47) + '...' : queryName;
        }
        
        // URL parse et ve query parametresinden al
        const url = new URL(location);
        const query = url.searchParams.get('query');
        if (query) {
          const decoded = decodeURIComponent(query).trim();
          return decoded.length > 50 ? decoded.substring(0, 47) + '...' : decoded;
        }
      } catch (e) {
        // URL parse hatası, orijinal location'ı kullan
      }
    }
    
    // Normal metin ise direkt göster (maksimum uzunluk)
    return location.length > 50 ? location.substring(0, 47) + '...' : location;
  };
  
  const locationDisplayName = getLocationDisplayName(event.location);

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
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <span className="text-base font-medium text-blue-700 group-hover:text-blue-800 truncate max-w-[200px]" title={event.location}>
                      {locationDisplayName || event.location}
                    </span>
                    <svg 
                      className="w-3.5 h-3.5 flex-shrink-0 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 truncate text-base">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate" title={event.location || ''}>{locationDisplayName || event.location}</span>
                  </div>
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