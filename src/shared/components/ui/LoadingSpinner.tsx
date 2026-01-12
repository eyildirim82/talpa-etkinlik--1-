import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text,
}) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
            <Loader2 className={cn('animate-spin text-brand-primary', sizes[size])} />
            {text && (
                <p className="text-body-sm text-text-muted">{text}</p>
            )}
        </div>
    );
};
