import NextAuth from 'next-auth';
import { authConfig } from '@/features/auth/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPatientRoute = pathname.startsWith('/patient');
  const isDoctorRoute = pathname.startsWith('/doctor');
  const isAdminRoute = pathname.startsWith('/admin');

  const isProtectedRoute = isPatientRoute || isDoctorRoute || isAdminRoute;

  // 1. Unauthenticated users accessing protected routes -> Redirect to /login
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session?.user) {
    const userRole = session.user.role;

    // 2. Role-based Route Protection
    if (isPatientRoute && userRole !== 'PATIENT') {
      if (userRole === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    if (isDoctorRoute && userRole !== 'DOCTOR') {
      if (userRole === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', req.url));
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    if (isAdminRoute && userRole !== 'ADMIN') {
      if (userRole === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', req.url));
      if (userRole === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
    }

    // 3. Redirect authenticated users away from /login or /register
    if (pathname === '/login' || pathname === '/register') {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');

      if (callbackUrl) {
        if (
          callbackUrl.startsWith('/book-appointment') ||
          (!callbackUrl.startsWith('/admin') &&
            !callbackUrl.startsWith('/doctor') &&
            !callbackUrl.startsWith('/patient'))
        ) {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }

        if (callbackUrl.startsWith('/patient') && userRole === 'PATIENT') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
        if (callbackUrl.startsWith('/doctor') && userRole === 'DOCTOR') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
        if (callbackUrl.startsWith('/admin') && userRole === 'ADMIN') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
      }

      if (userRole === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', req.url));
      if (userRole === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  // Clone headers to pass down to server components
  const requestHeaders = new Headers(req.headers);
  const host = requestHeaders.get('host') || '';
  requestHeaders.set('x-tenant-host', host);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    '/',
    '/patient/:path*',
    '/doctor/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
