import React from 'react';
import {
    Calendar,
    Ticket,
    Users,
    TrendingUp,
    DollarSign,
    Activity,
    Loader2
} from 'lucide-react';
import { useAdminStats, useAdminTickets } from '@/modules/admin';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accentColor }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(13, 33, 55, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {/* Accent line */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: accentColor
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'rgba(229, 229, 229, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0
                }}>{title}</p>
                <p style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#E5E5E5',
                    margin: '0.5rem 0 0 0',
                    lineHeight: 1
                }}>{value}</p>
                {subtitle && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'rgba(212, 175, 55, 0.7)',
                        margin: '0.5rem 0 0 0'
                    }}>{subtitle}</p>
                )}
            </div>
            <div style={{
                padding: '0.875rem',
                borderRadius: '12px',
                background: `${accentColor}15`,
                color: accentColor
            }}>
                {icon}
            </div>
        </div>
    </div>
);

export const OverviewPanel: React.FC = () => {
    const { data: stats, isLoading: statsLoading } = useAdminStats();

    if (statsLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px'
            }}>
                <Loader2 style={{
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite',
                    color: '#D4AF37'
                }} />
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#E5E5E5',
                    margin: 0
                }}>Genel Bakış</h2>
                <p style={{
                    color: 'rgba(229, 229, 229, 0.5)',
                    marginTop: '0.5rem',
                    fontSize: '0.9rem'
                }}>Dashboard istatistikleri ve son aktiviteler</p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
            }}>
                <StatCard
                    title="Toplam Etkinlik"
                    value={stats?.totalEvents || 0}
                    icon={<Calendar style={{ width: '24px', height: '24px' }} />}
                    accentColor="#3B82F6"
                />
                <StatCard
                    title="Asil Başvurular"
                    value={stats?.asilCount || 0}
                    subtitle={`Yedek: ${stats?.yedekCount || 0}`}
                    icon={<Users style={{ width: '24px', height: '24px' }} />}
                    accentColor="#10B981"
                />
                <StatCard
                    title="Bilet Gönderilen"
                    value={stats?.paidCount || 0}
                    subtitle="Ödeme onayı alınan"
                    icon={<Ticket style={{ width: '24px', height: '24px' }} />}
                    accentColor="#3B82F6"
                />
                <StatCard
                    title="Toplam Gelir"
                    value={`${(stats?.totalRevenue || 0).toLocaleString('tr-TR')} ₺`}
                    icon={<DollarSign style={{ width: '24px', height: '24px' }} />}
                    accentColor="#D4AF37"
                />
                <StatCard
                    title="Doluluk Oranı"
                    value={`%${stats?.occupancyRate || 0}`}
                    subtitle={stats?.activeEvent?.title || 'Aktif etkinlik yok'}
                    icon={<Activity style={{ width: '24px', height: '24px' }} />}
                    accentColor="#F59E0B"
                />
            </div>

            {/* Active Event Banner */}
            {stats?.activeEvent && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(196, 30, 58, 0.1) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '16px',
                    padding: '1.5rem 2rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem'
                }}>
                    <div style={{
                        padding: '0.875rem',
                        borderRadius: '12px',
                        background: 'rgba(212, 175, 55, 0.2)'
                    }}>
                        <TrendingUp style={{ width: '28px', height: '28px', color: '#D4AF37' }} />
                    </div>
                    <div>
                        <p style={{
                            fontSize: '0.7rem',
                            color: 'rgba(212, 175, 55, 0.7)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            margin: 0
                        }}>Aktif Etkinlik</p>
                        <p style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#D4AF37',
                            margin: '0.25rem 0 0 0'
                        }}>{stats.activeEvent.title}</p>
                    </div>
                </div>
            )}

            {/* Recent Activity - Removed for now, can be added back with bookings data */}

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default OverviewPanel;
