import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn utility exists, otherwise will define it

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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

        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talpa-gold disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-talpa-red text-white hover:bg-talpa-red-light shadow-sm",
            secondary: "bg-talpa-gold text-talpa-bg hover:bg-talpa-goldHover shadow-sm",
            outline: "border border-talpa-border bg-transparent hover:bg-talpa-card hover:text-talpa-primary",
            ghost: "hover:bg-talpa-card hover:text-talpa-primary",
            danger: "bg-talpa-danger text-white hover:bg-red-700",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-8 text-base uppercase tracking-wider font-bold",
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
