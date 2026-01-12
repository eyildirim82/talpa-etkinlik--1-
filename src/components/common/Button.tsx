import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn utility exists, otherwise will define it

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'black';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        fullWidth = false,
        isLoading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
    }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-normal ease-motion-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-brand-accent text-white hover:bg-brand-accent/90 shadow-sm border border-transparent",
            secondary: "bg-brand-gold text-ui-background-dark hover:bg-brand-gold-hover shadow-sm",
            outline: "border border-ui-border bg-transparent text-text-primary hover:bg-ui-background",
            ghost: "hover:bg-ui-background text-text-secondary hover:text-text-primary",
            danger: "bg-state-error text-white hover:bg-state-error/90 shadow-sm",
            black: "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm",
        };

        const sizes = {
            sm: "h-8 px-3 text-caption",
            md: "h-10 px-4 py-2 text-body-sm",
            lg: "h-12 px-8 text-body uppercase tracking-wider font-bold",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <div className="mr-2">{leftIcon}</div>}
                {children}
                {!isLoading && rightIcon && <div className="ml-2">{rightIcon}</div>}
            </button>
        );
    }
);

Button.displayName = 'Button';
