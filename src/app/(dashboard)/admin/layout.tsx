import { requireAdmin } from '@/server/security/auth-helpers';
import LogoutButton from '@/components/shared/LogoutButton';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏥</span>
          <span className="font-bold text-base">Hospital Admin</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-emerald-700 text-emerald-100 font-medium px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 hidden md:flex items-center space-x-3 border-b border-slate-800">
          <span className="text-2xl">🏥</span>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">
              Hospital Portal
            </h1>
            <p className="text-xs text-slate-400">Admin Control Center</p>
          </div>
        </div>

        {/* Current Admin User Info */}
        <div className="p-4 mx-4 my-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
          <p className="text-slate-400">Signed in as:</p>
          <p className="font-semibold text-white truncate mt-0.5">{user.email}</p>
          <span className="inline-block mt-2 bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[10px] tracking-wide">
            ROLE: ADMIN
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 py-2 text-sm font-medium">
          <Link
            href="/admin/dashboard"
            className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-150"
          >
            <span className="mr-3">📊</span> Dashboard
          </Link>
          <Link
            href="/admin/departments"
            className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-150"
          >
            <span className="mr-3">🏢</span> Departments
          </Link>
          <Link
            href="/admin/doctors"
            className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-150"
          >
            <span className="mr-3">👨‍⚕️</span> Doctors
          </Link>

          <Link
            href="/admin/appointments"
            className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-150"
          >
            <span className="mr-3">📅</span> Appointments
          </Link>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
