import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { getAdminAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';

export default async function AdminDashboardPage() {
  await requireAdmin();

  // Concurrent system statistics queries
  const [
    deptCount,
    doctorCount,
    patientCount,
    totalAppts,
    bookedAppts,
    confirmedAppts,
    completedAppts,
    cancelledAppts,
    recentApptsResult,
  ] = await Promise.all([
    prisma.department.count(),
    prisma.doctorProfile.count(),
    prisma.patientProfile.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'BOOKED' } }),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    getAdminAppointments({ page: 1, limit: 6 }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-300 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Admin Dashboard Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            System-wide hospital management, department master data, doctor provisioning, and appointment supervision.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/departments"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Departments
          </Link>
          <Link
            href="/admin/doctors"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Doctors
          </Link>
          <Link
            href="/admin/appointments"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Appointments
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Departments</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{deptCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Doctors</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{doctorCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Patients</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{patientCount}</span>
        </div>
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm text-center">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Booked</span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">{bookedAppts}</span>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm text-center col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">{completedAppts}</span>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📊 System-Wide Appointments Overview</h2>
            <p className="text-xs text-slate-500">Total System Appointments: {totalAppts} (Booked: {bookedAppts}, Confirmed: {confirmedAppts}, Cancelled: {cancelledAppts})</p>
          </div>
          <Link
            href="/admin/appointments"
            className="text-xs font-semibold text-purple-600 hover:underline"
          >
            View Master List →
          </Link>
        </div>

        {recentApptsResult.appointments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500">No appointments logged in system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Patient</th>
                  <th className="py-3 px-3">Doctor</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentApptsResult.appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {a.dateStr} <span className="text-slate-400 font-normal">({formatTimeTo12Hour(a.startTime)})</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{a.patient.fullName}</td>
                    <td className="py-3.5 px-3 text-slate-700">{a.doctor.fullName}</td>
                    <td className="py-3.5 px-3 text-purple-700 font-semibold">{a.doctor.department.name}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/admin/appointments/${a.id}`}
                        className="text-purple-600 hover:underline font-bold"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
