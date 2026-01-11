/**
 * OverviewPanel Component
 * Admin dashboard overview with statistics
 * 
 * Uses domain module APIs:
 * - reporting: useDashboardStats
 */
import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';
// Domain module import - using public API
import { useDashboardStats } from '@/modules/reporting';
import { StatsCard } from './StatsCard';

// SessionStorage key to remember if panel was loaded
const PANEL_LOADED_KEY = '__overview_panel_loaded__'

function wasPanelLoaded(): boolean {
    try {
        return sessionStorage.getItem(PANEL_LOADED_KEY) === 'true'
    } catch {
        return false
    }
}

function setPanelLoaded(): void {
    try {
        sessionStorage.setItem(PANEL_LOADED_KEY, 'true')
    } catch {
        // Ignore
    }
}

export const OverviewPanel: React.FC = () => {
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const hasBeenLoadedRef = useRef(wasPanelLoaded());

    // Once data is loaded, remember it
    React.useEffect(() => {
        if (stats && !statsLoading) {
            hasBeenLoadedRef.current = true;
            setPanelLoaded();
        }
    }, [stats, statsLoading]);

    // Only show loading if panel was never loaded before
    const shouldShowLoading = statsLoading && !hasBeenLoadedRef.current && !stats;

    if (shouldShowLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Toplam Etkinlik"
                    value={stats?.totalEvents || 0}
                    icon="event_available"
                    trend={{ value: '12%', direction: 'up' }}
                />
                <StatsCard
                    title="Asil Başvurular"
                    value={stats?.asilCount || 0}
                    icon="group"
                    description={`Yedek: ${stats?.yedekCount || 0}`}
                />
                <StatsCard
                    title="Bilet Gönderilen"
                    value={stats?.paidCount || 0}
                    icon="confirmation_number"
                    description="Ödeme onayı alınan"
                />
                <StatsCard
                    title="Toplam Gelir"
                    value={`${(stats?.totalRevenue || 0).toLocaleString('tr-TR')} ₺`}
                    icon="payments"
                />
                <StatsCard
                    title="Doluluk Oranı"
                    value={`%${stats?.occupancyRate || 0}`}
                    icon="analytics"
                    description={stats?.activeEvent?.title || 'Aktif etkinlik yok'}
                />
            </div>

            {/* Active Event Banner */}
            {stats?.activeEvent && (
                <div className="p-6 bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle flex items-center gap-5">
                    <div className="p-3.5 rounded-xl bg-brand-primary/10">
                        <span className="material-symbols-outlined text-brand-primary text-[28px]">trending_up</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Aktif Etkinlik</p>
                        <p className="text-h3 font-display font-medium text-text-primary">{stats.activeEvent.title}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewPanel;
