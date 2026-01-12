import React from 'react';
import { cn } from '@/src/lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    containerClassName?: string;
    placeholder?: string;
    options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, containerClassName, label, error, helperText, fullWidth = true, disabled, placeholder, options, ...props }, ref) => {
        return (
            <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", containerClassName)}>
                {label && (
                    <label className="text-label font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        className={cn(
                            "flex h-10 w-full rounded-md border border-ui-border bg-ui-background px-3 py-2 pr-10 text-body-sm ring-offset-ui-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-normal ease-motion-default appearance-none cursor-pointer",
                            error && "border-state-error focus-visible:ring-state-error/20 focus-visible:border-state-error",
                            className
                        )}
                        ref={ref}
                        disabled={disabled}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-secondary">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
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
Select.displayName = "Select";
