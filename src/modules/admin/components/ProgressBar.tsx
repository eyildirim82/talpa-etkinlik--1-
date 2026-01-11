import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label = true }) => {
    const percentage = Math.min((current / total) * 100, 100);

    const colorClass = percentage >= 100 ? 'bg-brand-primary' : percentage >= 80 ? 'bg-state-success' : 'bg-gray-300';
    const textColorClass = percentage >= 100 ? 'text-brand-primary' : percentage >= 80 ? 'text-state-success' : 'text-gray-400';

    return (
        <div className="flex flex-col gap-2 w-32">
            {label && (
                <div className="flex justify-between text-xs">
                    <span className="text-text-primary font-medium">{current}/{total}</span>
                    <span className={textColorClass}>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` } as React.CSSProperties}
                />
        </div>
    );
};
