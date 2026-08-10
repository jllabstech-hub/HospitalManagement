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
  await requireAdmin();
  const resolvedParams = await params;

  const appt = await prisma.appointment.findUnique({
    where: { id: resolvedParams.id },
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/admin/appointments" className="hover:text-purple-600">
          ← Appointments Master Directory
        </Link>
        <span>/</span>
        <span className="text-slate-800">Detail</span>
      </div>

      {/* Appointment Detail Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              System Audit Detail
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 mt-2">Appointment Specification</h1>
            <p className="text-xs text-slate-500 mt-0.5">ID: {appt.id}</p>
          </div>
          <div>
            <StatusBadge status={appt.status} size="lg" />
          </div>
        </div>

        {/* Patient, Doctor, Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">👤 Patient</h3>
            <p><strong className="text-slate-700">Name:</strong> {appt.patient.fullName}</p>
            <p><strong className="text-slate-700">Email:</strong> {appt.patient.user.email}</p>
            <p><strong className="text-slate-700">Phone:</strong> {appt.patient.phoneNumber}</p>
            <p><strong className="text-slate-700">Gender:</strong> {appt.patient.gender}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">👨‍⚕️ Doctor & Department</h3>
            <p><strong className="text-slate-700">Doctor:</strong> {appt.doctor.fullName}</p>
            <p><strong className="text-slate-700">Specialty:</strong> {appt.doctor.qualification}</p>
            <p><strong className="text-purple-700">Department:</strong> {appt.doctor.department.name}</p>
            <p><strong className="text-slate-700">Doctor Email:</strong> {appt.doctor.user.email}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">📅 Schedule Audit</h3>
            <p><strong className="text-slate-700">Date:</strong> {dateStr}</p>
            <p>
              <strong className="text-slate-700">Time:</strong> {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
            </p>
            <p><strong className="text-slate-700">Created:</strong> {appt.createdAt.toISOString()}</p>
            <p><strong className="text-slate-700">Updated:</strong> {appt.updatedAt.toISOString()}</p>
          </div>
        </div>

        {/* Cancellation Log if Cancelled */}
        {appt.status === 'CANCELLED' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <p className="font-bold">🚫 Cancellation Audit Log</p>
            {appt.cancelledBy && <p><strong>Cancelled By Role:</strong> {appt.cancelledBy}</p>}
            {appt.cancellationReason && <p><strong>Reason Provided:</strong> {appt.cancellationReason}</p>}
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <Link
            href="/admin/appointments"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            ← Back to Master Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
