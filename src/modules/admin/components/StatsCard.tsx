import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1 min-w-[240px]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                </div>
                <div className="text-gray-400">
                    {icon}
                </div>
            </div>

            <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full mb-1 flex items-center gap-1
                        ${trend.direction === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}
                    `}>
                        {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
                    </span>
                )}
            </div>

            {description && (
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
        </div>
    );
};
