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

    // 3. Redirect authenticated users away from /login or /register to their role dashboard
    if (pathname === '/login' || pathname === '/register') {
      if (userRole === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', req.url));
      if (userRole === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return NextResponse.next();
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
