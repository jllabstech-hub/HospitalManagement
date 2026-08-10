import { ReactNode } from 'react';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import LogoutButton from '@/components/shared/LogoutButton';
import BrandLogo from '@/components/layout/BrandLogo';

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const user = await requirePatient();

  return (
    <div className="flex min-h-screen flex-col bg-surface-warm font-sans">
      <header className="sticky top-0 z-40 border-b border-[#dde5e9]/90 bg-white/95 shadow-header backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/patient/dashboard" size="sm" />
            <span className="hidden border-l border-[#dde5e9] pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 sm:block">
              Patient Self-Service
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Patient">
            <Link href="/patient/dashboard" className="link-nav">
              Dashboard
            </Link>
            <Link href="/patient/doctors" className="link-nav">
              Find a Doctor
            </Link>
            <Link href="/patient/appointments" className="link-nav">
              My Appointments
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="max-w-[160px] truncate text-xs font-semibold text-ink">{user.email}</p>
              <span className="mt-0.5 inline-block rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700">
                PATIENT
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex justify-around border-b border-[#dde5e9] bg-white px-2 py-2 text-xs font-medium text-ink-muted md:hidden">
        <Link href="/patient/dashboard" className="rounded-button px-3 py-2 hover:bg-brand-50 hover:text-brand-800">
          Dashboard
        </Link>
        <Link
          href="/patient/doctors"
          className="rounded-button px-3 py-2 font-semibold text-brand-700 hover:bg-brand-50"
        >
          Find Doctor
        </Link>
        <Link href="/patient/appointments" className="rounded-button px-3 py-2 hover:bg-brand-50 hover:text-brand-800">
          Appointments
        </Link>
      </div>

      <main className="mx-auto w-full max-w-wide flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-[#dde5e9] bg-white py-4 text-center text-xs text-ink-soft">
        CarePulse Hospital Portal © {new Date().getUTCFullYear()}. All rights reserved.
      </footer>
    </div>
  );
}
