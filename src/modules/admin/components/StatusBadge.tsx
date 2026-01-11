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
                    bg: 'bg-state-success-bg',
                    text: 'text-state-success-text',
                    dot: 'bg-state-success',
                    label: 'Aktif'
                };
            case 'SOLD_OUT':
                return {
                    bg: 'bg-state-error-bg',
                    text: 'text-state-error-text',
                    dot: 'bg-state-error',
                    label: 'Tükendi'
                };
            case 'DRAFT':
                return {
                    bg: 'bg-ui-background',
                    text: 'text-text-muted',
                    dot: 'bg-text-muted',
                    label: 'Taslak'
                };
            case 'ARCHIVED':
                return {
                    bg: 'bg-state-info-bg',
                    text: 'text-state-info-text',
                    dot: 'bg-state-info',
                    label: 'Arşiv'
                };
            default:
                return {
                    bg: 'bg-ui-background',
                    text: 'text-text-muted',
                    dot: 'bg-text-muted',
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
