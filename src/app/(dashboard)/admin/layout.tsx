import { requireAdmin } from '@/server/security/auth-helpers';
import LogoutButton from '@/components/shared/LogoutButton';
import BrandLogo from '@/components/layout/BrandLogo';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-surface-warm md:flex-row">
      <header className="flex items-center justify-between bg-brand-950 p-4 text-white shadow-md md:hidden">
        <BrandLogo href="/admin/dashboard" variant="light" size="sm" />
        <span className="rounded bg-accent-700 px-2 py-0.5 text-xs font-medium text-accent-50">
          ADMIN
        </span>
      </header>

      <aside className="flex w-full shrink-0 flex-col bg-brand-950 text-brand-100 md:w-64">
        <div className="hidden items-center gap-3 border-b border-white/10 p-6 md:flex">
          <BrandLogo href="/admin/dashboard" variant="light" size="sm" />
        </div>

        <div className="mx-4 my-3 rounded-card border border-white/10 bg-white/5 p-4 text-xs">
          <p className="text-brand-300">Signed in as:</p>
          <p className="mt-0.5 truncate font-semibold text-white">{user.email}</p>
          <span className="mt-2 inline-block rounded bg-accent-700/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-100">
            Role: ADMIN
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-2 text-sm font-medium" aria-label="Admin">
          <Link
            href="/admin/dashboard"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Analytics
          </Link>
          <Link
            href="/admin/departments"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Departments
          </Link>
          <Link
            href="/admin/doctors"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Doctors
          </Link>
          <Link
            href="/admin/appointments"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Appointments
          </Link>
          <Link
            href="/admin/content"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Content
          </Link>
          <Link
            href="/admin/content-import"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Import Content
          </Link>
          <Link
            href="/admin/media"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Media Library
          </Link>
          <Link
            href="/admin/enquiries"
            className="flex items-center rounded-button px-3 py-2.5 transition hover:bg-white/10 hover:text-white"
          >
            Enquiries
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
