import { ReactNode } from 'react';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import LogoutButton from '@/components/shared/LogoutButton';

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const user = await requirePatient();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-black text-lg">
              🏥
            </div>
            <div>
              <Link href="/patient/dashboard" className="font-bold text-base tracking-wide hover:text-blue-200 transition">
                CarePulse Portal
              </Link>
              <span className="block text-[10px] text-blue-300/80 uppercase tracking-widest font-semibold">
                Patient Self-Service
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/patient/dashboard"
              className="text-slate-200 hover:text-white transition py-1 border-b-2 border-transparent hover:border-blue-400"
            >
              Dashboard
            </Link>
            <Link
              href="/patient/doctors"
              className="text-slate-200 hover:text-white transition py-1 border-b-2 border-transparent hover:border-blue-400"
            >
              Find a Doctor
            </Link>
            <span className="text-slate-400 cursor-not-allowed text-xs px-2 py-1 bg-white/5 rounded border border-white/10" title="Coming in Phase 5C">
              My Appointments (Soon)
            </span>
          </nav>

          {/* User Badge & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white truncate max-w-[160px]">
                {user.email}
              </p>
              <span className="inline-block bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded text-[10px] tracking-wide">
                PATIENT
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-slate-800 text-slate-200 px-4 py-2 flex justify-around text-xs font-medium border-b border-slate-700">
        <Link href="/patient/dashboard" className="hover:text-white py-1">
          Dashboard
        </Link>
        <Link href="/patient/doctors" className="hover:text-white py-1 font-bold text-blue-300">
          🔍 Find Doctor
        </Link>
        <span className="text-slate-400 py-1">
          Appointments
        </span>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-center py-4 text-xs text-slate-500">
        Hospital Appointment Management System &copy; {new Date().getUTCFullYear()} CarePulse Health. All rights reserved.
      </footer>
    </div>
  );
}
