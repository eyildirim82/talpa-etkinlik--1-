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

