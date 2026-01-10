import React from 'react';

export type StatusType = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'SOLD_OUT';

interface StatusBadgeProps {
    status: StatusType | string;
    label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {

    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'ACTIVE':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    dot: 'bg-emerald-500',
                    label: 'Aktif'
                };
            case 'SOLD_OUT':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    dot: 'bg-red-500',
                    label: 'Tükendi'
                };
            case 'DRAFT':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-600',
                    dot: 'bg-gray-400',
                    label: 'Taslak'
                };
            case 'ARCHIVED':
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    dot: 'bg-blue-500',
                    label: 'Arşiv'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-600',
                    dot: 'bg-gray-400',
                    label: s
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
            {label || config.label}
        </span>
    );
};
