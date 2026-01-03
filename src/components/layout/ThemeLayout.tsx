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
            "min-h-screen transition-colors duration-300",
            variant === 'dark' ? "bg-talpa-bg text-talpa-primary" : "bg-white text-talpa-text-primary",
            className
        )}>
            {children}
        </div>
    );
};
