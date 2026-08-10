import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getDoctorPublicProfile } from '@/features/doctors/queries';
import { getHospitalTodayDateString } from '@/lib/date-utils';
import DoctorProfileSlotPicker from '@/features/appointments/components/DoctorProfileSlotPicker';

interface PageProps {
  params: Promise<{
    doctorId: string;
  }>;
}

export default async function DoctorProfilePage({ params }: PageProps) {
  await requirePatient();

  const resolvedParams = await params;
  const doctorId = resolvedParams.doctorId;

  const doctor = await getDoctorPublicProfile(doctorId);

  if (!doctor) {
    notFound();
  }

  const isUnavailable = !doctor.user.isActive || !doctor.department.isActive;
  const todayDate = getHospitalTodayDateString();

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/patient/doctors" className="hover:text-blue-600">
          ← Find a Doctor
        </Link>
        <span>/</span>
        <span className="text-slate-800">{doctor.fullName}</span>
      </div>

      {isUnavailable ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="text-4xl">🏥</div>
          <h2 className="text-xl font-bold text-slate-800">Doctor Unavailable</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This doctor or their medical department is currently unavailable for outpatient appointments. Please return to the doctor directory to select an active doctor.
          </p>
          <div className="pt-2">
            <Link
              href="/patient/doctors"
              className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Browse Active Doctors
            </Link>
          </div>
        </div>
      ) : (
        <DoctorProfileSlotPicker doctor={doctor} todayDate={todayDate} />
      )}
    </div>
  );
}
