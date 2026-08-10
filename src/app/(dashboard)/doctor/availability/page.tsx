import { requireDoctor } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import ScheduleManager from '@/features/availability/components/ScheduleManager';
import { notFound } from 'next/navigation';

export default async function DoctorAvailabilityPage() {
  const user = await requireDoctor();
  const doctorId = user.doctorProfileId;

  if (!doctorId) {
    notFound();
  }

  const [doctorProfile, availabilities, blockedDates] = await Promise.all([
    prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { fullName: true },
    }),
    prisma.weeklyAvailability.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    }),
    prisma.blockedDate.findMany({
      where: { doctorId },
      orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        reason: true,
      },
    }),
  ]);

  if (!doctorProfile) {
    notFound();
  }

  return (
    <ScheduleManager
      availabilities={availabilities}
      blockedDates={blockedDates}
      doctorName={doctorProfile.fullName}
    />
  );
}
