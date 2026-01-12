import React from 'react';
import { cn } from '@/src/lib/utils';

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
    error?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, required, error, children, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    "text-label font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary",
                    error && "text-state-error",
                    className
                )}
                {...props}
            >
                {children}
                {required && <span className="text-state-error ml-1">*</span>}
            </label>
        );
    }
);
Label.displayName = "Label";
