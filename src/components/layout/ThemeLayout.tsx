import React from 'react';
import { cn } from '../../lib/utils';

interface ThemeLayoutProps {
    children: React.ReactNode;
    variant?: 'dark' | 'light';
    className?: string;
}

export const ThemeLayout: React.FC<ThemeLayoutProps> = ({
    children,
    variant = 'light',
    className
}) => {
    return (
        <div className={cn(
            "min-h-screen transition-colors duration-slow ease-motion-default",
            variant === 'dark' ? "bg-ui-background text-text-primary" : "bg-ui-surface text-text-primary",
            className
        )}>
            {children}
        </div>
    );
};
