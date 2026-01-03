import React from 'react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Booking, QueueStatus } from '../types/booking.types'

interface BookingStatusProps {
  booking: Booking | null
  queuePosition?: number | null
  isLoading?: boolean
}

export const BookingStatus: React.FC<BookingStatusProps> = ({
  booking,
  queuePosition,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 animate-spin rounded-full" />
        <span>Yükleniyor...</span>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const getStatusDisplay = () => {
    switch (booking.queue_status) {
      case 'ASIL':
        return {
          icon: <CheckCircle2 className="w-6 h-6" />,
          text: 'KAYDINIZ ALINDI (ASİL)',
          subtext: 'Ödeme onayından sonra biletiniz e-postanıza gelecektir.',
          colorClass: 'bg-green-600 text-white'
        }
      case 'YEDEK':
        return {
          icon: <Clock className="w-6 h-6" />,
          text: `YEDEK LİSTEDESİNİZ${queuePosition ? ` (SIRA: ${queuePosition})` : ''}`,
          subtext: 'Yer açıldığında size haber verilecektir.',
          colorClass: 'bg-yellow-600 text-white'
        }
      case 'IPTAL':
        return {
          icon: <XCircle className="w-6 h-6" />,
          text: 'BAŞVURUNUZ İPTAL EDİLDİ',
          subtext: 'Bu etkinlik için başvurunuz iptal edilmiştir.',
          colorClass: 'bg-red-600 text-white'
        }
      default:
        return null
    }
  }

  const statusDisplay = getStatusDisplay()

  if (!statusDisplay) {
    return null
  }

  return (
    <div className={`p-4 rounded-lg ${statusDisplay.colorClass} flex items-start gap-3`}>
      {statusDisplay.icon}
      <div className="flex-1">
        <p className="font-bold text-lg">{statusDisplay.text}</p>
        <p className="text-sm opacity-90 mt-1">{statusDisplay.subtext}</p>
        {booking.payment_status === 'PAID' && (
          <p className="text-sm font-semibold mt-2">✓ Ödeme Alındı</p>
        )}
      </div>
    </div>
  )
}

