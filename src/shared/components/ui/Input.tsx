import React from 'react';
import { cn } from '@/src/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, containerClassName, type, label, error, helperText, leftIcon, rightIcon, fullWidth = true, disabled, ...props }, ref) => {
        return (
            <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", containerClassName)}>
                {label && (
                    <label className="text-label font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-ui-border bg-ui-background px-3 py-2 text-body-sm ring-offset-ui-background file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-normal ease-motion-default",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-state-error focus-visible:ring-state-error/20 focus-visible:border-state-error",
                            className
                        )}
                        ref={ref}
                        disabled={disabled}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-secondary">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error ? (
                    <div className="flex items-center gap-1 text-caption text-state-error animate-in slide-in-from-top-1 fade-in duration-fast">
                        <AlertCircle className="h-3 w-3" />
                        <span>{error}</span>
                    </div>
                ) : helperText ? (
                    <p className="text-caption text-text-secondary">{helperText}</p>
                ) : null}
            </div>
        );
    }
);
Input.displayName = "Input";
