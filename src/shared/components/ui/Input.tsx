import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', label, error, helperText, size = 'md', leftIcon, rightIcon, ...props }, ref) => {
        const sizeClasses = {
            sm: 'h-8 px-2.5 text-body-sm',
            md: 'h-10 px-3 py-2 text-body',
            lg: 'h-12 px-4 text-body-lg',
        };

        const iconSizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-5 h-5',
            lg: 'w-5 h-5',
        };

        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label className="text-label text-text-primary font-medium">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className={cn(
                            'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
                            iconSizeClasses[size]
                        )}>
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'w-full bg-ui-surface border rounded-md',
                            'text-text-primary outline-none transition-colors',
                            'focus:border-interactive-focus-border focus:ring-2 focus:ring-interactive-focus-ring',
                            error
                                ? 'border-state-error focus:border-state-error focus:ring-state-error/20'
                                : 'border-ui-border',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            sizeClasses[size],
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className={cn(
                            'absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
                            iconSizeClasses[size]
                        )}>
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-caption text-state-error">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-caption text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
