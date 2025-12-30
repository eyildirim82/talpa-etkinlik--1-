import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AuthModal } from './AuthModal';
import { ArrowRight, AlertCircle, User, Lock, AlertOctagon, CheckCircle2, Clock, XCircle, List } from 'lucide-react';
import { createEventRequest, getUserRequest } from '../actions/requests';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RequestStatus } from '../types';

export const ActionZone: React.FC = () => {
  const { event, user } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 1. Check for existing request
  const { data: userRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['request', event?.id, user?.id],
    queryFn: () => event && user ? getUserRequest(event.id) : null,
    enabled: !!event && !!user,
  });

  // 2. Mutation for creating request
  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
      return await createEventRequest(event.id);
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate query to refetch status
        queryClient.invalidateQueries({ queryKey: ['request', event?.id, user?.id] });
      } else {
        setErrorMsg(result.message);
      }
    },
    onError: () => {
      setErrorMsg("Bir hata oluştu.");
    }
  });

  if (!event) return null;

  // Stock Logic using DB View properties
  const isLowStock = event.remaining_stock < 20 && event.remaining_stock > 0;
  const isSoldOut = event.remaining_stock <= 0;

  const handleAction = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setErrorMsg(null);
    requestMutation.mutate();
  };

  const getButtonContent = () => {
    // 1. Loading State
    // Only consider request loading if user exists (query is enabled)
    const isRequestLoading = user && isLoadingRequest;

    if (isRequestLoading || requestMutation.isPending) {
      return {
        text: 'İŞLEM SÜRÜYOR...',
        subtext: 'Lütfen bekleyiniz',
        icon: <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />,
        disabled: true,
        colorClass: 'bg-talpa-primary'
      }
    }

    // 2. Existing Request State
    if (userRequest) {
      switch (userRequest.status) {
        case RequestStatus.PENDING:
          return {
            text: 'TALEBİNİZ ALINDI',
            subtext: 'Yönetici onayı bekleniyor',
            icon: <Clock className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-orange-500 text-white'
          };
        case RequestStatus.APPROVED:
          return {
            text: 'TALEBİNİZ ONAYLANDI',
            subtext: 'Ödeme ve biletleme için hazırsınız',
            icon: <CheckCircle2 className="w-8 h-8" />,
            disabled: true, // For now disabled, next step would be "Buy Ticket"
            colorClass: 'bg-green-600 text-white'
          };
        case RequestStatus.WAITLIST:
          return {
            text: 'YEDEK LİSTEDESİNİZ',
            subtext: 'Yer açıldığında size haber verilecek',
            icon: <List className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-yellow-600 text-white'
          };
        case RequestStatus.REJECTED:
          return {
            text: 'TALEP REDDEDİLDİ',
            subtext: 'Bu etkinlik için talebiniz onaylanmadı',
            icon: <XCircle className="w-8 h-8" />,
            disabled: true,
            colorClass: 'bg-red-600 text-white'
          };
      }
    }

    // 3. Default State (No Request)
    if (isSoldOut) {
      return {
        text: 'KONTENJAN DOLDU',
        subtext: 'Yeni talepler kapandı',
        icon: <AlertCircle className="w-8 h-8" />,
        disabled: true,
        colorClass: 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
      }
    }

    if (!user) {
      return {
        text: 'GİRİŞ YAP / KAYIT OL',
        subtext: 'Talep oluşturmak için önce giriş yapın',
        icon: <Lock className="w-6 h-6" />,
        disabled: false,
        colorClass: 'bg-talpa-primary hover:bg-talpa-accent text-white'
      }
    }

    return {
      text: 'TALEP OLUŞTUR',
      subtext: 'Etkinliğe katılım isteği gönder',
      icon: <ArrowRight className="w-8 h-8" />,
      disabled: false,
      colorClass: 'bg-talpa-primary hover:bg-talpa-accent text-white'
    }
  };

  const btnContent = getButtonContent();

  return (
    <div className="w-full bg-white py-10">
      <div className="max-w-4xl mx-auto px-6 md:px-0">

        {/* Status & User Info Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

          {/* Availability Badge */}
          <div className="flex items-center gap-3">
            {isSoldOut ? (
              <span className="inline-flex items-center gap-2 text-talpa-danger font-medium bg-red-50 px-3 py-1 rounded-sm text-sm border border-red-100">
                <AlertCircle size={16} /> TALEP KAPALI
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">Kalan Kontenjan</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-mono font-bold ${isLowStock ? 'text-talpa-warning' : 'text-talpa-success'}`}>
                    {event.remaining_stock.toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm font-mono text-talpa-border">/ {event.total_quota}</span>
                </div>
              </div>
            )}
          </div>
        </div>

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
            * TALEBİNİZ ONAYLANDIKTAN SONRA BİLET ALIM İŞLEMİNİ TAMAMLAYABİLİRSİNİZ.
          </p>
        </div>

      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};