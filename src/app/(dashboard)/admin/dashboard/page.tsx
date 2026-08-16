import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { getAdminAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const resolvedParams = await searchParams;
  const search = resolvedParams.search?.trim() || '';
  const tenantWhere = { tenantId: admin.tenantId };

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
    prisma.department.count({ where: tenantWhere }),
    prisma.doctorProfile.count({ where: tenantWhere }),
    prisma.patientProfile.count({ where: tenantWhere }),
    prisma.appointment.count({ where: tenantWhere }),
    prisma.appointment.count({ where: { ...tenantWhere, status: 'BOOKED' } }),
    prisma.appointment.count({ where: { ...tenantWhere, status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { ...tenantWhere, status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { ...tenantWhere, status: 'CANCELLED' } }),
    getAdminAppointments({ page: 1, limit: 6, search }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="System-wide hospital management, department master data, doctor provisioning, and appointment supervision."
        frontendPath="/"
      />
      <section className="portal-hero px-6 py-8 sm:px-8">
        <div className="absolute inset-0 portal-grid opacity-20" aria-hidden />
        <div className="absolute -right-10 -bottom-20 h-64 w-64 rounded-full border-[34px] border-accent-400/20" aria-hidden />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">
              System Administration
            </span>
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight">Hospital operations, at a glance.</p>
            <p className="mt-2 max-w-xl text-sm text-brand-100">
              System-wide hospital management, department master data, doctor provisioning, and
              appointment supervision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/departments" className="btn-primary !bg-brand-600">
              Departments
            </Link>
            <Link href="/admin/doctors" className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
              Doctors
            </Link>
            <Link href="/admin/appointments" className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
              Appointments
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: 'Total Departments', value: deptCount },
          { label: 'Total Doctors', value: doctorCount },
          { label: 'Patients', value: patientCount },
          { label: 'Booked', value: bookedAppts, tone: 'brand' },
          { label: 'Completed', value: completedAppts, tone: 'accent' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`metric-card text-center ${
              stat.tone === 'brand'
                ? 'border-brand-200 bg-brand-50'
                : stat.tone === 'accent'
                  ? 'border-accent-200 bg-accent-50'
                  : 'border-[#dde5e9] bg-white'
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              {stat.label}
            </span>
            <span className="mt-1 block text-2xl font-bold text-ink">{stat.value}</span>
          </div>
        ))}
      </div>

      <section className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink">System-Wide Appointments Overview</h2>
            <p className="text-xs text-ink-muted">
              Total System Appointments: {totalAppts} (Booked: {bookedAppts}, Confirmed:{' '}
              {confirmedAppts}, Cancelled: {cancelledAppts})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InteractiveSearchInput
              defaultValue={search}
              placeholder="Search patient/doctor..."
              className="w-56"
            />
            <Link
              href="/admin/appointments"
              className="whitespace-nowrap text-xs font-semibold text-brand-700 hover:underline"
            >
              View Master List →
            </Link>
          </div>
        </div>

        {recentApptsResult.appointments.length === 0 ? (
          <div className="rounded-card border border-dashed border-[#c9d5db] bg-surface-muted p-8 text-center">
            <p className="text-xs text-ink-muted">No appointments logged in system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#dde5e9] font-bold uppercase tracking-wider text-ink-soft">
                  <th className="px-3 py-3">Date & Time</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Doctor</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f4] font-medium">
                {recentApptsResult.appointments.map((a) => (
                  <tr key={a.id} className="transition hover:bg-brand-50/40">
                    <td className="px-3 py-3.5 font-semibold text-ink">
                      {a.dateStr}{' '}
                      <span className="font-normal text-ink-soft">
                        ({formatTimeTo12Hour(a.startTime)})
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-ink-muted">{a.patient.fullName}</td>
                    <td className="px-3 py-3.5 text-ink-muted">{a.doctor.fullName}</td>
                    <td className="px-3 py-3.5 font-semibold text-brand-700">
                      {a.doctor.department.name}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link
                        href={`/admin/appointments/${a.id}`}
                        className="font-bold text-brand-700 hover:underline"
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
      </section>
    </div>
  );
}
