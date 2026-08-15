import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminAppointmentDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const resolvedParams = await params;

  const appt = await prisma.appointment.findFirst({
    where: { id: resolvedParams.id, tenantId: admin.tenantId },
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      reason: true,
      cancellationReason: true,
      cancelledBy: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          dateOfBirth: true,
          gender: true,
          user: { select: { email: true } },
        },
      },
      doctor: {
        select: {
          id: true,
          fullName: true,
          qualification: true,
          phoneNumber: true,
          department: { select: { id: true, name: true } },
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!appt) {
    notFound();
  }

  const dateStr = appt.appointmentDate.toISOString().split('T')[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-ink-muted">
        <Link href="/admin/appointments" className="hover:text-brand-700">
          ← Appointments Master Directory
        </Link>
        <span>/</span>
        <span className="text-ink">Detail</span>
      </div>

      {/* Appointment Detail Card */}
      <div className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-pill border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-700">
              System Audit Detail
            </span>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Appointment Specification</h1>
            <p className="mt-0.5 text-xs text-ink-muted">ID: {appt.id}</p>
          </div>
          <div>
            <StatusBadge status={appt.status} size="lg" />
          </div>
        </div>

        {/* Patient, Doctor, Schedule Grid */}
        <div className="grid grid-cols-1 gap-6 text-xs md:grid-cols-3">
          <div className="space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-5">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Patient</h3>
            <p>
              <strong className="text-ink">Name:</strong> {appt.patient.fullName}
            </p>
            <p>
              <strong className="text-ink">Email:</strong> {appt.patient.user.email}
            </p>
            <p>
              <strong className="text-ink">Phone:</strong> {appt.patient.phoneNumber}
            </p>
            <p>
              <strong className="text-ink">Gender:</strong> {appt.patient.gender}
            </p>
          </div>

          <div className="space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-5">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">
              Doctor & Department
            </h3>
            <p>
              <strong className="text-ink">Doctor:</strong> {appt.doctor.fullName}
            </p>
            <p>
              <strong className="text-ink">Specialty:</strong> {appt.doctor.qualification}
            </p>
            <p>
              <strong className="text-brand-700">Department:</strong> {appt.doctor.department.name}
            </p>
            <p>
              <strong className="text-ink">Doctor Email:</strong> {appt.doctor.user.email}
            </p>
          </div>

          <div className="space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-5">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Schedule Audit</h3>
            <p>
              <strong className="text-ink">Date:</strong> {dateStr}
            </p>
            <p>
              <strong className="text-ink">Time:</strong> {formatTimeTo12Hour(appt.startTime)} –{' '}
              {formatTimeTo12Hour(appt.endTime)}
            </p>
            <p>
              <strong className="text-ink">Created:</strong> {appt.createdAt.toISOString()}
            </p>
            <p>
              <strong className="text-ink">Updated:</strong> {appt.updatedAt.toISOString()}
            </p>
          </div>
        </div>

        {/* Cancellation Log if Cancelled */}
        {appt.status === 'CANCELLED' && (
          <div className="space-y-1 rounded-card border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
            <p className="font-bold">Cancellation Audit Log</p>
            {appt.cancelledBy && (
              <p>
                <strong>Cancelled By Role:</strong> {appt.cancelledBy}
              </p>
            )}
            {appt.cancellationReason && (
              <p>
                <strong>Reason Provided:</strong> {appt.cancellationReason}
              </p>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="flex items-center justify-between border-t border-[#dde5e9] pt-4">
          <Link href="/admin/appointments" className="btn-secondary !px-5 !py-2.5 !text-xs">
            ← Back to Master Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
