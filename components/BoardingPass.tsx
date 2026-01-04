import React from 'react';
import { QrCode, Download, CheckCircle, Plane } from 'lucide-react';
import { EventData, User, Ticket } from '../types';

interface BoardingPassProps {
  ticket: Ticket;
  event: EventData;
  user: User;
}

export const BoardingPass: React.FC<BoardingPassProps> = ({ ticket, event, user }) => {

  if (!ticket || !user || !event) return null;

  // Formatters
  const dateObj = new Date(event.event_date);
  const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:bg-white print:min-h-0 print:p-0">
      <div className="max-w-md w-full print:max-w-none">

        {/* Success Message - Hidden in Print */}
        <div className="text-center mb-8 print:hidden">
          <div className="w-16 h-16 bg-talpa-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-talpa-success" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">İşlem Başarılı</h2>
          <p className="text-gray-500 mt-2">Biletiniz oluşturuldu.</p>
        </div>

        {/* Boarding Pass Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-200 print:shadow-none print:border print:border-gray-300 print:rounded-lg">

          {/* Header with Aviation Theme */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-center relative">
            {/* Airline Style Header */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Plane className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-xs font-mono tracking-widest uppercase">TALPA Havacılık</span>
            </div>
            <h1 className="text-xl font-bold text-white leading-snug">{event.title}</h1>
            <p className="text-white/60 text-sm mt-2 font-mono">{dateStr} • {timeStr}</p>
          </div>

          {/* Notch/Punch Hole Divider - Creates authentic boarding pass look */}
          <div className="relative flex items-center justify-between px-0 h-8 bg-white">
            {/* Left punch hole */}
            <div className="w-8 h-8 bg-gray-100 rounded-full -ml-4 border-r border-gray-200 print:bg-white"></div>
            {/* Dashed tear line */}
            <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-0"></div>
            {/* Right punch hole */}
            <div className="w-8 h-8 bg-gray-100 rounded-full -mr-4 border-l border-gray-200 print:bg-white"></div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 pt-2">
            <div className="flex flex-col gap-5">

              {/* Passenger & Seat Row */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Katılımcı / Passenger</span>
                  <span className="font-bold text-gray-900 text-lg">{user.full_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Koltuk / Seat</span>
                  <span className="font-bold text-gray-900 text-2xl font-mono">{ticket.seat_number || '—'}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Konum</span>
                  <span className="font-semibold text-gray-800">{ticket.gate || 'Ana Salon'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Tarih</span>
                  <span className="font-semibold text-gray-800">{dateStr.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Saat</span>
                  <span className="font-semibold text-gray-800">{timeStr}</span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 block mb-1 font-mono uppercase tracking-wider">Bilet Kodu</span>
                  <span className="font-mono text-xs text-gray-500 break-all">{ticket.qr_code}</span>
                </div>
                <div className="p-3 bg-white border-2 border-gray-900 rounded-lg ml-4">
                  <QrCode className="w-20 h-20 text-gray-900" strokeWidth={1} />
                </div>
              </div>

            </div>
          </div>

          {/* Stub Section - Bottom tear-off portion */}
          <div className="relative">
            {/* Second notch divider */}
            <div className="relative flex items-center justify-between px-0 h-6 bg-white">
              <div className="w-6 h-6 bg-gray-100 rounded-full -ml-3 print:bg-white"></div>
              <div className="flex-1 border-t border-dashed border-gray-300 mx-0"></div>
              <div className="w-6 h-6 bg-gray-100 rounded-full -mr-3 print:bg-white"></div>
            </div>

            {/* Stub Content */}
            <div className="bg-gray-50 px-6 py-4 text-center print:bg-white">
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                Bu bilet sadece 1 kişi için geçerlidir • Giriş için QR kodu gösteriniz
              </p>
            </div>
          </div>

        </div>

        {/* Action Footer - Hidden in Print */}
        <div className="mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-full py-4 flex items-center justify-center gap-2 bg-slate-800 text-white font-medium hover:bg-slate-700 rounded-xl transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Bileti İndir / Yazdır
          </button>
        </div>

      </div>
    </div>
  );
};