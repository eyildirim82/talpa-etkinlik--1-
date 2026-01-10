import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { User, EventData } from '@/types';
import AdminPage from '@/pages/AdminPage';
import TicketViewPage from '@/pages/TicketViewPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeLayout } from '@/components/layout/ThemeLayout';
import { LuxuryHeader } from '@/components/layout/LuxuryHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { CinematicHero } from '@/components/home/CinematicHero';
import { StickyFooter } from '@/components/home/StickyFooter';
import { AuthModal } from '@/modules/auth';
import { BookingModal } from '@/modules/booking';

interface AppRoutesProps {
    user: User | null;
    activeEvent: EventData | null;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ user, activeEvent }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const navigate = useNavigate();

    const handleAdminClick = () => {
        navigate('/admin');
    };

    const handleHomeClick = () => {
        navigate('/');
    };

    const handleJoinClick = () => {
        if (!user) {
            setShowAuthModal(true);
        } else {
            setShowBookingModal(true);
        }
    };

    return (
        <Routes>
            <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                    <ThemeLayout variant="dark">
                        <AdminPage onBack={handleHomeClick} />
                    </ThemeLayout>
                </ProtectedRoute>
            } />
            <Route path="/ticket/:id" element={
                <ProtectedRoute>
                    <ThemeLayout variant="dark">
                        <TicketViewPage />
                    </ThemeLayout>
                </ProtectedRoute>
            } />
            <Route path="/" element={
                <ThemeLayout variant="dark">
                    <LuxuryHeader
                        user={user}
                        onAuthClick={() => setShowAuthModal(true)}
                        onAdminClick={handleAdminClick}
                    />
                    {!activeEvent ? (
                        <EmptyState />
                    ) : (
                        <>
                            <CinematicHero event={activeEvent} />
                            <StickyFooter
                                event={activeEvent}
                                onJoin={handleJoinClick}
                            />
                        </>
                    )}
                    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
                    {showBookingModal && activeEvent && (
                        <BookingModal
                            eventId={parseInt(activeEvent.id.toString())}
                            eventPrice={activeEvent.price}
                            user={user}
                            onClose={() => setShowBookingModal(false)}
                            onSuccess={(queue) => {
                                console.log('Joined queue:', queue);
                                window.location.reload();
                            }}
                        />
                    )}
                </ThemeLayout>
            } />
        </Routes>
    );
};
