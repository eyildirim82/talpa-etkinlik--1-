import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode | string; // Material Symbols string or React node
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
                {typeof icon === 'string' ? (
                    <span className="material-symbols-outlined text-text-muted/50 group-hover:text-brand-primary transition-colors font-light">
                        {icon}
                    </span>
                ) : (
                    <span className="text-text-muted/50 group-hover:text-brand-primary transition-colors">
                        {icon}
                    </span>
                )}
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-h1 font-display font-medium text-text-primary">{value}</span>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1
                        ${trend.direction === 'up' ? 'text-state-success bg-green-50' : 'text-brand-primary bg-red-50'}
                    `}>
                        <span className="material-symbols-outlined text-[12px]">trending_up</span> {trend.value}
                    </span>
                )}
                {description && (
                    <span className="text-text-muted text-xs font-medium">{description}</span>
                )}
            </div>
        </div>
    );
};
