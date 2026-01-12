import React from 'react';
import { cn } from '@/src/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, label, error, helperText, fullWidth = true, disabled, rows = 4, ...props }, ref) => {
        return (
            <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", containerClassName)}>
                {label && (
                    <label className="text-label font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary">
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        "flex w-full rounded-md border border-ui-border bg-ui-background px-3 py-2 text-body-sm ring-offset-ui-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-normal ease-motion-default resize-y min-h-[80px]",
                        error && "border-state-error focus-visible:ring-state-error/20 focus-visible:border-state-error",
                        className
                    )}
                    ref={ref}
                    disabled={disabled}
                    rows={rows}
                    {...props}
                />
                {error ? (
                    <div className="flex items-center gap-1 text-xs text-state-error animate-in slide-in-from-top-1 fade-in duration-fast">
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
Textarea.displayName = "Textarea";
