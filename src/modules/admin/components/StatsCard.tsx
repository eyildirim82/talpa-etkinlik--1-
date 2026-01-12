import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode; // Lucide React icon component
    trend?: {
        value: string;
        direction: 'up' | 'down';
    };
    description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    trend,
    description
}) => {
    return (
        <div className="p-6 bg-ui-surface rounded-2xl border border-ui-border-subtle shadow-subtle flex flex-col gap-4 group hover:border-brand-primary/20 transition-colors">
            <div className="flex justify-between items-start">
                <span className="text-text-muted text-body-sm font-medium">{title}</span>
                <span className="text-text-muted/50 group-hover:text-brand-primary transition-colors">
                    {icon}
                </span>
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-h1 font-display font-medium text-text-primary">{value}</span>
                {trend && (
                    <span className={`text-caption font-medium px-2 py-0.5 rounded-full flex items-center gap-1
                        ${trend.direction === 'up' ? 'text-state-success-text bg-state-success-bg' : 'text-state-error-text bg-state-error-bg'}
                    `}>
                        <TrendingUp className="w-3 h-3" /> {trend.value}
                    </span>
                )}
                {description && (
                    <span className="text-text-muted text-caption font-medium">{description}</span>
                )}
            </div>
        </div>
    );
};
