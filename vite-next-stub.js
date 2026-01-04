// Stub module for Next.js - prevents Vite from processing Next.js packages
// This file is used as an alias to prevent Vite from trying to bundle Next.js
export default {};
export const NextRequest = class { };
export const NextResponse = class { };
export const cookies = () => ({ get: () => null, set: () => { }, delete: () => { } });

// next/navigation stubs
export const redirect = (url) => {
    console.warn('[STUB] redirect called with:', url);
    // In a real Vite app, use window.location or router navigation
};

export const revalidatePath = (path) => {
    console.warn('[STUB] revalidatePath called with:', path);
    // No-op in Vite context
};

// next/image stub - renders a standard img with fill support
import React from 'react';
export const Image = React.forwardRef(function Image({ src, alt, fill, priority, sizes, className, ...props }, ref) {
    const style = fill ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        inset: 0,
        objectFit: className?.includes('object-cover') ? 'cover' : 'contain',
    } : {};
    return React.createElement('img', {
        ref,
        src,
        alt,
        style,
        className,
        loading: priority ? 'eager' : 'lazy',
        ...props,
    });
});
