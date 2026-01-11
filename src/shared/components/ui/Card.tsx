import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
        const variantClasses = {
            default: 'bg-ui-surface border border-ui-border shadow-subtle',
            elevated: 'bg-ui-surface border border-ui-border shadow-elevation-2',
            outlined: 'bg-ui-surface border-2 border-ui-border-strong',
        };

        const paddingClasses = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-lg transition-colors',
                    variantClasses[variant],
                    paddingClasses[padding],
                    hover && 'hover:bg-interactive-hover-surface hover:border-interactive-hover-border',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
