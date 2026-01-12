/**
 * ARCHIVED: Next.js Middleware
 * 
 * Bu dosya Next.js middleware implementasyonunu içerir.
 * Vite projesine geçiş nedeniyle arşivlenmiştir.
 * 
 * Route protection artık React Router ve ProtectedRoute component'i ile yapılmaktadır.
 * 
 * Arşivlenme Tarihi: 2026-01-XX
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create standard Supabase Client for Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Check Session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Route Protection Logic
  const path = request.nextUrl.pathname

  // PROTECTED ROUTES: Any path starting with /admin or /ticket
  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/ticket')

  // AUTH ROUTES: Login/Register pages
  const isAuthRoute = path === '/login' || path === '/register'

  // Rule 1: Protected route + No user -> Redirect to Login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path) // Optional: Store return URL
    return NextResponse.redirect(url)
  }

  // Rule 2: Auth route + User logged in -> Redirect to Home (Optional, improves UX)
  // if (isAuthRoute && user) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/'
  //   return NextResponse.redirect(url)
  // }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, assets, public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
