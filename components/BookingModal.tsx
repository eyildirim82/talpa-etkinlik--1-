import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useJoinEvent } from '@/modules/booking';
import type { QueueStatus } from '@/modules/booking';
import type { User } from '../types';

interface BookingModalProps {
  eventId: number;
  eventPrice: number;
  onClose: () => void;
  onSuccess: (queue: QueueStatus) => void;
  user: User | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  eventId,
  eventPrice,
  onClose,
  onSuccess,
  user
}) => {
  const [consentKvkk, setConsentKvkk] = useState(false);
  const [consentPayment, setConsentPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const joinEventMutation = useJoinEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Kullanıcı kontrolü
    if (!user) {
      setErrorMsg('İşlem için giriş yapmalısınız. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }

    if (!consentKvkk || !consentPayment) {
      setErrorMsg('KVKK ve ödeme onaylarını vermelisiniz.');
      return;
    }

    const result = await joinEventMutation.mutateAsync({
      eventId,
      consentKvkk,
      consentPayment
    });

    if (result.success && result.queue) {
      onSuccess(result.queue);
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  const canSubmit = consentKvkk && consentPayment && !joinEventMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Başvuru Onayı</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={joinEventMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Information */}
        {user ? (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Sayın <strong>{user.full_name}</strong>, etkinliğe ön kayıt yaptırmak üzeresiniz.
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Uyarı:</strong> Giriş yapmamış görünüyorsunuz. Lütfen sayfayı yenileyip tekrar deneyin.
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* KVKK Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentKvkk}
              onChange={(e) => setConsentKvkk(e.target.checked)}
              className="mt-1 w-5 h-5 text-talpa-primary border-gray-300 rounded focus:ring-talpa-primary"
              disabled={joinEventMutation.isPending}
            />
            <span className="text-sm text-gray-700">
              <strong>KVKK Aydınlatma Metni</strong>'ni okudum ve kabul ediyorum.
            </span>
          </label>

          {/* Payment Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentPayment}
              onChange={(e) => setConsentPayment(e.target.checked)}
              className="mt-1 w-5 h-5 text-talpa-primary border-gray-300 rounded focus:ring-talpa-primary"
              disabled={joinEventMutation.isPending}
            />
            <span className="text-sm text-gray-700">
              <strong>Mesafeli Satış Sözleşmesi</strong>'ni okudum ve{' '}
              <strong>{eventPrice.toLocaleString('tr-TR')} ₺</strong> tutarındaki ödemeyi onaylıyorum.
            </span>
          </label>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Not:</strong> Başvurunuz onaylandıktan sonra ödeme işlemini tamamlamanız gerekecektir.
              Ödeme onayından sonra biletiniz e-postanıza gönderilecektir.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={joinEventMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 bg-talpa-primary text-white rounded-lg font-semibold hover:bg-talpa-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joinEventMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Onaylıyorum ve Katıl
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

