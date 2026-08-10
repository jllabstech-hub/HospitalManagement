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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/doctor/appointments" className="hover:text-indigo-600">
          ← Appointments Directory
        </Link>
        <span>/</span>
        <span className="text-slate-800">Detail</span>
      </div>

      {/* Appointment Detail Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Doctor Patient Consultation
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 mt-2">Consultation Detail</h1>
            <p className="text-xs text-slate-500 mt-0.5">ID: {appt.id}</p>
          </div>
          <div>
            <StatusBadge status={appt.status} size="lg" />
          </div>
        </div>

        {/* Patient & Schedule Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">👤 Patient Summary</h3>
            <p><strong className="text-slate-700">Full Name:</strong> {appt.patient.fullName}</p>
            <p><strong className="text-slate-700">Phone:</strong> {appt.patient.phoneNumber}</p>
            <p><strong className="text-slate-700">Gender:</strong> {appt.patient.gender}</p>
            <p><strong className="text-slate-700">Date of Birth:</strong> {appt.patient.dateOfBirth.toISOString().split('T')[0]}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">📅 Schedule Info</h3>
            <p><strong className="text-slate-700">Date:</strong> {appt.dateStr}</p>
            <p>
              <strong className="text-slate-700">Time Slot:</strong> {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
            </p>
            <p><strong className="text-slate-700">Created:</strong> {appt.createdAt.toISOString().split('T')[0]}</p>
          </div>
        </div>

        {/* Cancellation Reason if Cancelled */}
        {appt.status === 'CANCELLED' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <p className="font-bold">🚫 Consultation Cancelled</p>
            {appt.cancelledBy && <p><strong>Cancelled By:</strong> {appt.cancelledBy}</p>}
            {appt.cancellationReason && <p><strong>Reason:</strong> {appt.cancellationReason}</p>}
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/doctor/appointments"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            ← Back to Directory
          </Link>

          <DoctorAppointmentActionButtons appointmentId={appt.id} currentStatus={appt.status} />
        </div>
      </div>
    </div>
  );
}
