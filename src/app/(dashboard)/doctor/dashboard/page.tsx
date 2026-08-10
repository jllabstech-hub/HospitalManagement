import Link from 'next/link';
import { requireDoctor } from '@/server/security/auth-helpers';
import { getDoctorAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour, getHospitalTodayDateString } from '@/lib/date-utils';
import DoctorAppointmentActionButtons from '@/features/appointments/components/DoctorAppointmentActionButtons';

export default async function DoctorDashboardPage() {
  const user = await requireDoctor();
  const todayStr = getHospitalTodayDateString();

  const { appointments, counts } = await getDoctorAppointments(user.doctorProfileId, {
    dateStr: todayStr,
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Doctor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Doctor Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Logged in as <span className="font-semibold text-white">{user.email}</span>. Manage today&apos;s outpatient appointments and consultation schedules.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/doctor/appointments"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition"
          >
            <span>📅 Appointment Directory</span>
          </Link>
          <Link
            href="/doctor/availability"
            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition"
          >
            <span>⚙️ Availability</span>
          </Link>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Today Total</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{counts.total}</span>
        </div>
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm text-center">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Booked</span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">{counts.booked}</span>
        </div>
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 shadow-sm text-center">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Confirmed</span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">{counts.confirmed}</span>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm text-center">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">{counts.completed}</span>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📋 Today&apos;s Appointments ({todayStr})</h2>
            <p className="text-xs text-slate-500">Outpatient patient queue sorted chronologically.</p>
          </div>
          <Link
            href="/doctor/appointments"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View All Dates →
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
            <div className="text-3xl">📅</div>
            <h4 className="text-sm font-bold text-slate-700">No Appointments Today</h4>
            <p className="text-xs text-slate-500">You have no scheduled outpatient consultations for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-2">{appt.patient.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    Contact: {appt.patient.phoneNumber} | Gender: {appt.patient.gender}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <DoctorAppointmentActionButtons appointmentId={appt.id} currentStatus={appt.status} />
                  <Link
                    href={`/doctor/appointments/${appt.id}`}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition shadow-2xs"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
