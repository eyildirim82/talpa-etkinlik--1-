import React from 'react';
import { useApp } from '../contexts/AppContext';
import { QrCode, Download, CheckCircle } from 'lucide-react';
import { Ticket } from '../types';

interface BoardingPassProps {
  ticket: Ticket;
}

export const BoardingPass: React.FC<BoardingPassProps> = ({ ticket }) => {
  const { event, user } = useApp();

  if (!ticket || !user || !event) return null;

  // Formatters
  const dateObj = new Date(event.event_date);
  const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-talpa-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-talpa-success" />
          </div>
          <h2 className="text-2xl font-bold text-talpa-primary">İşlem Başarılı</h2>
          <p className="text-talpa-secondary mt-2">Biletiniz oluşturuldu.</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-talpa-border/50">
          
          {/* Header */}
          <div className="bg-talpa-primary p-8 text-center">
            <h1 className="text-xl font-bold text-white leading-snug">{event.title}</h1>
            <p className="text-white/60 text-sm mt-2">{dateStr} • {timeStr}</p>
          </div>

          {/* Ticket Body */}
          <div className="p-8">
            <div className="flex flex-col gap-6">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs text-talpa-secondary block mb-1">Katılımcı</span>
                  <span className="font-semibold text-talpa-primary text-lg">{user.full_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-talpa-secondary block mb-1">Koltuk</span>
                  <span className="font-bold text-talpa-primary text-lg">{ticket.seat_number}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-talpa-secondary block mb-1">Konum</span>
                  <span className="font-medium text-talpa-primary">{ticket.gate || 'Ana Salon'}</span>
                </div>
                <div>
                  <span className="text-xs text-talpa-secondary block mb-1">Kod</span>
                  <span className="font-mono text-sm text-talpa-secondary truncate w-full block">
                    {ticket.qr_code}
                  </span>
                </div>
              </div>

              {/* QR */}
              <div className="flex justify-center py-4">
                <div className="p-4 border border-talpa-border rounded-xl">
                  <QrCode className="w-32 h-32 text-talpa-primary" strokeWidth={1.5} />
                </div>
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-50 p-6 border-t border-gray-100">
             <button 
               onClick={() => window.print()}
               className="w-full py-3 flex items-center justify-center gap-2 text-talpa-primary font-medium hover:bg-gray-100 rounded-lg transition-colors"
             >
               <Download className="w-5 h-5" />
               Bileti İndir
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};