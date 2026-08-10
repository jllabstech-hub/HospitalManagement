import { requireDoctor } from '@/server/security/auth-helpers';
import LogoutButton from '@/components/shared/LogoutButton';
import BrandLogo from '@/components/layout/BrandLogo';
import Link from 'next/link';

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDoctor();

  return (
    <div className="flex min-h-screen flex-col bg-surface-warm md:flex-row">
      <header className="flex items-center justify-between bg-brand-950 p-4 text-white shadow-md md:hidden">
        <div className="flex items-center gap-2">
          <BrandLogo href="/doctor/dashboard" variant="light" size="sm" />
        </div>
        <span className="rounded bg-brand-700 px-2 py-0.5 text-xs font-medium text-brand-50">
          DOCTOR
        </span>
      </header>

      <aside className="flex w-full shrink-0 flex-col bg-brand-950 text-brand-100 md:w-64">
        <div className="hidden items-center gap-3 border-b border-white/10 p-6 md:flex">
          <BrandLogo href="/doctor/dashboard" variant="light" size="sm" />
        </div>

        <div className="mx-4 my-3 rounded-card border border-white/10 bg-white/5 p-4 text-xs">
          <p className="text-brand-300">Signed in as:</p>
          <p className="mt-0.5 truncate font-semibold text-white">{user.email}</p>
          <span className="mt-2 inline-block rounded bg-brand-700/40 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-100">
            Role: DOCTOR
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-2 text-sm font-medium" aria-label="Doctor">
          <Link
            href="/doctor/dashboard"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/doctor/appointments"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Appointment Queue
          </Link>
          <Link
            href="/doctor/availability"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Schedule Manager
          </Link>
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
