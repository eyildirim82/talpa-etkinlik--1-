import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AuthModal } from './AuthModal';
import { BookingModal } from '@/modules/booking';
import { BookingStatus } from '@/modules/booking';
import { ArrowRight, AlertCircle, Lock, AlertOctagon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useBooking, useBookingQueuePosition } from '@/modules/booking';
import { QueueStatus } from '@/modules/booking';

export const ActionZone: React.FC = () => {
  const { event, user } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Convert event id to number if it's a string (backward compatibility)
  const eventId = event?.id ? (typeof event.id === 'string' ? parseInt(event.id) : event.id) : null;

  // Get user's booking for this event
  const { data: booking, isLoading: isLoadingBooking } = useBooking(eventId || null);

  // Get queue position if in yedek list
  const { data: queuePosition } = useBookingQueuePosition(
    eventId || null,
    user?.id || null
  );

  if (!event) return null;

  // Calculate availability
  const totalQuota = (event as any).quota_asil + (event as any).quota_yedek || event.total_quota || 0;
  const remainingStock = event.remaining_stock || 0;
  const isLowStock = remainingStock < 20 && remainingStock > 0;
  const isSoldOut = remainingStock <= 0;

  // Calculate asil/yedek counts (if available)
  const asilCount = (event as any).asil_count;
  const yedekCount = (event as any).yedek_count;
  const quotaAsil = (event as any).quota_asil || totalQuota;
  const quotaYedek = (event as any).quota_yedek || 0;

  const handleAction = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isSoldOut) {
      return; // Button disabled
    }

    setErrorMsg(null);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (queue: QueueStatus) => {
    // Booking successful, modal will close automatically
    // Query will refetch automatically via hook invalidation
  };

  const getButtonContent = () => {
    // 1. Loading State
    if (user && isLoadingBooking) {
      return {
        text: 'YÜKLENİYOR...',
        subtext: 'Lütfen bekleyiniz',
        icon: <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />,
        disabled: true,
        colorClass: 'bg-talpa-primary'
      }
    }

    // 2. Existing Booking State
    if (booking) {
      switch (booking.queue_status) {
        case QueueStatus.ASIL:
          return {
            text: '✅ KAYDINIZ ALINDI (ASİL)',
            subtext: 'Ödeme onayından sonra biletiniz e-postanıza gelecektir',
            icon: <CheckCircle2 className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-green-600 text-white'
          };
        case QueueStatus.YEDEK:
          return {
            text: `⚠️ YEDEK LİSTEDESİNİZ${queuePosition ? ` (SIRA: ${queuePosition})` : ''}`,
            subtext: 'Yer açıldığında size haber verilecek',
            icon: <Clock className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-yellow-600 text-white'
          };
        case QueueStatus.IPTAL:
          return {
            text: '❌ BAŞVURUNUZ İPTAL EDİLDİ',
            subtext: 'Bu etkinlik için başvurunuz iptal edilmiştir',
            icon: <XCircle className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-red-600 text-white'
          };
      }
    }

    // 3. Default State (No Booking)
    if (isSoldOut) {
      return {
        text: '❌ KONTENJAN DOLU',
        subtext: 'Yeni başvurular kabul edilmiyor',
        icon: <AlertCircle className="w-8 h-8" />,
        disabled: true,
        colorClass: 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
      }
    }

    if (!user) {
      return {
        text: 'BİLET ALMAK İÇİN GİRİŞ YAP',
        subtext: 'Etkinliğe katılmak için önce giriş yapın',
        icon: <Lock className="w-6 h-6" />,
        disabled: false,
        colorClass: 'bg-talpa-primary hover:bg-talpa-accent text-white'
      }
    }

    return {
      text: 'HEMEN KATIL',
      subtext: 'Etkinliğe başvuru yap',
      icon: <ArrowRight className="w-8 h-8" />,
      disabled: false,
      colorClass: 'bg-talpa-primary hover:bg-talpa-accent text-white'
    }
  };

  const btnContent = getButtonContent();

  return (
    <div className="w-full bg-white py-6 md:py-10 fixed bottom-0 left-0 right-0 z-30 md:relative md:z-auto border-t border-talpa-border md:border-t-0 shadow-lg md:shadow-none">
      <div className="max-w-4xl mx-auto px-6 md:px-0">

        {/* Status & User Info Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

          {/* Availability Badge */}
          <div className="flex items-center gap-3">
            {isSoldOut ? (
              <span className="inline-flex items-center gap-2 text-talpa-danger font-medium bg-red-50 px-3 py-1 rounded-sm text-sm border border-red-100">
                <AlertCircle size={16} /> BAŞVURU KAPALI
              </span>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Asil Kontenjan</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-mono font-bold ${asilCount >= quotaAsil ? 'text-red-600' : 'text-talpa-success'}`}>
                        {asilCount || 0}
                      </span>
                      <span className="text-sm font-mono text-talpa-border">/ {quotaAsil}</span>
                    </div>
                  </div>
                  {quotaYedek > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Yedek Kontenjan</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-mono font-bold ${yedekCount >= quotaYedek ? 'text-yellow-600' : 'text-talpa-warning'}`}>
                          {yedekCount || 0}
                        </span>
                        <span className="text-sm font-mono text-talpa-border">/ {quotaYedek}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Kalan: {remainingStock} / Toplam: {totalQuota}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Status Display */}
        {booking && (
          <div className="mb-6">
            <BookingStatus booking={booking} queuePosition={queuePosition || undefined} />
          </div>
        )}

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertOctagon className="text-talpa-danger w-5 h-5" />
            <span className="text-talpa-danger font-medium text-sm">{errorMsg}</span>
          </div>
        )}

        {/* Main CTA Button */}
        <button
          onClick={handleAction}
          disabled={btnContent.disabled}
          className={`
            w-full h-24
            flex items-center justify-between px-8
            text-lg md:text-2xl font-bold tracking-widest uppercase font-mono
            transition-all duration-300 active:translate-y-[2px]
            disabled:active:translate-y-0 disabled:cursor-not-allowed
            ${btnContent.colorClass}
          `}
        >
          <div className="flex flex-col items-start text-left">
            <span>{btnContent.text}</span>
            <span className="text-xs font-sans font-normal opacity-80 tracking-normal mt-1 normal-case block">
              {btnContent.subtext}
            </span>
          </div>

          {btnContent.icon}
        </button>

        {/* Footer Disclaimer */}
        <div className="mt-6 text-center border-t border-dashed border-talpa-border pt-4">
          <p className="text-[10px] md:text-xs text-talpa-secondary font-mono">
            * BAŞVURUNUZ ONAYLANDIKTAN SONRA ÖDEME İŞLEMİNİ TAMAMLAYABİLİRSİNİZ.
          </p>
        </div>

      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showBookingModal && eventId && (
        <BookingModal
          eventId={eventId}
          eventPrice={event.price || 0}
          user={user}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};