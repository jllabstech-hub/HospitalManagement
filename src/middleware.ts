import NextAuth from 'next-auth';
import { authConfig } from '@/features/auth/auth.config';
import { NextResponse } from 'next/server';
import { isDashboardPath, safeInternalPath } from '@/server/security/dashboard-paths';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPatientRoute = isDashboardPath(pathname, '/patient');
  const isDoctorRoute = isDashboardPath(pathname, '/doctor');
  const isAdminRoute = isDashboardPath(pathname, '/admin');

  const isProtectedRoute = isPatientRoute || isDoctorRoute || isAdminRoute;

  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session?.user) {
    const userRole = session.user.role;

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

    if (pathname === '/login' || pathname === '/register') {
      const callbackUrl = safeInternalPath(req.nextUrl.searchParams.get('callbackUrl'));

      if (callbackUrl) {
        if (
          callbackUrl.startsWith('/book-appointment') ||
          (!isDashboardPath(callbackUrl, '/admin') &&
            !isDashboardPath(callbackUrl, '/doctor') &&
            !isDashboardPath(callbackUrl, '/patient'))
        ) {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }

        if (isDashboardPath(callbackUrl, '/patient') && userRole === 'PATIENT') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
        if (isDashboardPath(callbackUrl, '/doctor') && userRole === 'DOCTOR') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
        if (isDashboardPath(callbackUrl, '/admin') && userRole === 'ADMIN') {
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
      }

      if (userRole === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', req.url));
      if (userRole === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  const requestHeaders = new Headers(req.headers);
  const host = req.headers.get('host') || req.nextUrl.host || '';
  // Always overwrite. Never trust a client-provided x-tenant-host.
  requestHeaders.set('x-tenant-host', host);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\..*).*)',
  ],
};
