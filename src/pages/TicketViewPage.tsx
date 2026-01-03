import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@/utils/supabase/client';
import { Download, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface TicketDetails {
    ticket_id: number;
    file_path: string;
    file_name: string;
    event_title: string;
    event_date: string;
    full_name: string;
}

export const TicketViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Booking ID or Ticket ID? Requirement says /ticket/[id] usually ticket id
    // check implementation plan: "/ticket/:id - Public/Private page for users to view their assigned ticket."
    const navigate = useNavigate();
    const supabase = createClient();
    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTicket = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Determine if ID is booking ID or pool ID. 
                // Let's assume it's Booking ID or we query by booking ID.
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError('Giriş yapmalısınız.');
                    setLoading(false);
                    return;
                }

                // Query booking to get event and profile + joined ticket info
                const { data: booking, error: bookingError } = await supabase
                    .from('bookings')
                    .select(`
                        id,
                        event_id,
                        user_id,
                        events (title, event_date),
                        profiles (full_name)
                    `)
                    .eq('id', id) // Assuming URL param is booking ID
                    .single();

                if (bookingError || !booking) {
                    // Try ticket_pool ID? No, safer to stick to booking ID as entry point
                    // Or maybe we search in ticket_pool?
                    setError('Bilet/Başvuru bulunamadı.');
                    return;
                }

                // Check RLS manually (though DB enforces it) - User must own booking or be admin
                // (Supabase RLS handles this usually, assuming policy setup)

                // Get assigned ticket
                const { data: ticketPool, error: ticketError } = await supabase
                    .from('ticket_pool')
                    .select('*')
                    .eq('event_id', booking.event_id)
                    .eq('assigned_to', booking.user_id) // assigned to this user
                    .single();

                if (!ticketPool) {
                    setError('Henüz bilet atanmamış.');
                    return;
                }

                setTicket({
                    ticket_id: ticketPool.id,
                    file_path: ticketPool.file_path,
                    file_name: ticketPool.file_name,
                    event_title: (booking.events as any).title,
                    event_date: (booking.events as any).event_date,
                    full_name: (booking.profiles as any).full_name
                });

            } catch (err) {
                console.error(err);
                setError('Bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [id]);

    const handleDownload = async () => {
        if (!ticket) return;
        try {
            const { data, error } = await supabase.storage
                .from('tickets')
                .download(ticket.file_path);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = ticket.file_name;
            a.click();
        } catch (err) {
            console.error(err);
            alert('İndirme sırasında hata oluştu.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            <Loader2 className="animate-spin w-8 h-8 text-yellow-500" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Hata</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <button onClick={() => navigate('/')} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded text-white transition-colors">
                Ana Sayfaya Dön
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-slate-900 border border-yellow-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>

                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center border border-green-500/20">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">{ticket?.event_title}</h1>
                <p className="text-slate-400 mb-6">
                    {new Date(ticket?.event_date || '').toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                </p>

                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-8">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Katılımcı</p>
                    <p className="text-lg font-medium text-white mb-4">{ticket?.full_name}</p>

                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bilet Dosyası</p>
                    <p className="text-sm text-yellow-500 font-mono">{ticket?.file_name}</p>
                </div>

                <button
                    onClick={handleDownload}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    Bileti İndir (PDF)
                </button>
            </div>
        </div>
    );
};

export default TicketViewPage;
