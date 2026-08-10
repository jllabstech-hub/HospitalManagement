import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPatientAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';

export default async function PatientDashboardPage() {
  const user = await requirePatient();
  const { upcoming } = await getPatientAppointments(user.patientProfileId);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-200 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Patient Dashboard
          </h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Logged in as <span className="font-semibold text-white">{user.email}</span>. Manage outpatient consultations and discover specialist doctors.
          </p>
        </div>
        <div>
          <Link
            href="/patient/doctors"
            className="inline-flex items-center space-x-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm px-5 py-3 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
          >
            <span>🔍 Find a Doctor</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📅 Upcoming Consultations</h2>
            <p className="text-xs text-slate-500">Your scheduled outpatient hospital visits.</p>
          </div>
          <Link
            href="/patient/appointments"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View All Appointments →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <div className="text-3xl">📅</div>
            <h4 className="text-sm font-bold text-slate-700">No Upcoming Appointments</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any upcoming doctor consultations scheduled. Browse our doctor directory to book a slot.
            </p>
            <div className="pt-2">
              <Link
                href="/patient/doctors"
                className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Find a Doctor
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((appt) => (
              <div
                key={appt.id}
                className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {appt.doctor.department.name}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{appt.doctor.fullName}</h3>
                  <p className="text-xs text-blue-600 font-medium">{appt.doctor.qualification}</p>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <p><strong className="text-slate-700">Date:</strong> {appt.dateStr}</p>
                    <p>
                      <strong className="text-slate-700">Time:</strong> {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 text-right">
                  <Link
                    href={`/patient/appointments/${appt.id}`}
                    className="inline-block px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-xs rounded-xl transition shadow-2xs"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Find Specialist Doctor</h3>
            <p className="text-xs text-slate-500 mt-1">Browse active hospital departments and book 30-min slots.</p>
          </div>
          <Link
            href="/patient/doctors"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
          >
            Browse Doctors
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Appointment History</h3>
            <p className="text-xs text-slate-500 mt-1">View completed, cancelled, and historical records.</p>
          </div>
          <Link
            href="/patient/appointments"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}
