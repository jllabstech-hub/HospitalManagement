import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireDoctor } from '@/server/security/auth-helpers';
import { getDoctorAppointmentDetail } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import DoctorAppointmentActionButtons from '@/features/appointments/components/DoctorAppointmentActionButtons';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DoctorAppointmentDetailPage({ params }: PageProps) {
  const user = await requireDoctor();
  const resolvedParams = await params;

  const appt = await getDoctorAppointmentDetail(user.doctorProfileId, resolvedParams.id);

  if (!appt) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-ink-muted">
        <Link href="/doctor/appointments" className="hover:text-brand-700">
          ← Appointments Directory
        </Link>
        <span>/</span>
        <span className="text-ink">Detail</span>
      </div>

      {/* Appointment Detail Card */}
      <div className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-pill border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-700">
              Doctor Patient Consultation
            </span>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Consultation Detail</h1>
            <p className="mt-0.5 text-xs text-ink-muted">ID: {appt.id}</p>
          </div>
          <div>
            <StatusBadge status={appt.status} size="lg" />
          </div>
        </div>

        {/* Patient & Schedule Info */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-5 text-xs">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Patient Summary</h3>
            <p>
              <strong className="text-ink">Full Name:</strong> {appt.patient.fullName}
            </p>
            <p>
              <strong className="text-ink">Phone:</strong> {appt.patient.phoneNumber}
            </p>
            <p>
              <strong className="text-ink">Gender:</strong> {appt.patient.gender}
            </p>
            <p>
              <strong className="text-ink">Date of Birth:</strong>{' '}
              {appt.patient.dateOfBirth.toISOString().split('T')[0]}
            </p>
          </div>

          <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-5 text-xs">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Schedule Info</h3>
            <p>
              <strong className="text-ink">Date:</strong> {appt.dateStr}
            </p>
            <p>
              <strong className="text-ink">Time Slot:</strong> {formatTimeTo12Hour(appt.startTime)} –{' '}
              {formatTimeTo12Hour(appt.endTime)}
            </p>
            <p>
              <strong className="text-ink">Created:</strong> {appt.createdAt.toISOString().split('T')[0]}
            </p>
          </div>
        </div>

        {/* Cancellation Reason if Cancelled */}
        {appt.status === 'CANCELLED' && (
          <div className="space-y-1 rounded-card border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
            <p className="font-bold">Consultation Cancelled</p>
            {appt.cancelledBy && (
              <p>
                <strong>Cancelled By:</strong> {appt.cancelledBy}
              </p>
            )}
            {appt.cancellationReason && (
              <p>
                <strong>Reason:</strong> {appt.cancellationReason}
              </p>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#dde5e9] pt-4 sm:flex-row">
          <Link href="/doctor/appointments" className="btn-secondary !px-5 !py-2.5 !text-xs">
            ← Back to Directory
          </Link>

          <DoctorAppointmentActionButtons appointmentId={appt.id} currentStatus={appt.status} />
        </div>
      </div>
    </div>
  );
}
