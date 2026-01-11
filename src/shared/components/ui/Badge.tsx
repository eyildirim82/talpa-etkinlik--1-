import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-ui-border-subtle text-text-primary',
            success: 'bg-state-success/10 text-state-success',
            warning: 'bg-state-warning/10 text-state-warning',
            error: 'bg-state-error/10 text-state-error',
            info: 'bg-state-info/10 text-state-info',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-caption',
            md: 'px-2.5 py-1 text-body-sm',
            lg: 'px-3 py-1.5 text-body-sm',
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium rounded-full',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
