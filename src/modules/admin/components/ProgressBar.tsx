import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label = true }) => {
    const percentage = Math.min((current / total) * 100, 100);

    return (
        <div className="w-full max-w-[140px]">
            {label && (
                <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-medium text-gray-900">{current}/{total}</span>
                    <span className="text-gray-400">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 
                        ${percentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}
                    `}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
