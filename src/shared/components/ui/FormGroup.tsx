import React from 'react';
import { cn } from '@/src/lib/utils';

export interface FormGroupProps {
    children: React.ReactNode;
    className?: string;
    error?: boolean;
    spacing?: 'sm' | 'md' | 'lg';
}

export const FormGroup: React.FC<FormGroupProps> = ({
    children,
    className,
    error,
    spacing = 'md',
}) => {
    const spacingClasses = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
    };

    return (
        <div
            className={cn(
                "flex flex-col",
                spacingClasses[spacing],
                error && "text-state-error",
                className
            )}
        >
            {children}
        </div>
    );
};

FormGroup.displayName = "FormGroup";
