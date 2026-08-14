'use server';

import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';

export async function getDashboardAnalytics() {
  const authUser = await requireAdmin();

  let tenantId: string | null = authUser.tenantId || null;

  if (authUser.id || authUser.email) {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(authUser.id ? [{ id: authUser.id }] : []),
          ...(authUser.email ? [{ email: authUser.email }] : []),
        ],
      },
      select: { tenantId: true },
    });
    if (dbUser?.tenantId) {
      tenantId = dbUser.tenantId;
    }
  }

  if (!tenantId) {
    const firstHospital = await prisma.hospitalProfile.findFirst({ select: { id: true } });
    if (firstHospital) {
      tenantId = firstHospital.id;
    }
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const tenantWhere = tenantId ? { tenantId } : {};

  // 1. Fetch Top-Level KPIs
  const [
    todayCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    noShowCount,
    totalCount,
    activeDoctorsCount,
    newPatientsCount,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { ...tenantWhere, appointmentDate: { gte: startOfToday, lte: endOfToday } },
    }),
    prisma.appointment.count({
      where: {
        ...tenantWhere,
        appointmentDate: { gt: endOfToday },
        status: { in: ['BOOKED', 'CONFIRMED'] },
      },
    }),
    prisma.appointment.count({
      where: { ...tenantWhere, status: 'COMPLETED' },
    }),
    prisma.appointment.count({
      where: { ...tenantWhere, status: 'CANCELLED' },
    }),
    prisma.appointment.count({
      where: { ...tenantWhere, status: 'NO_SHOW' },
    }),
    prisma.appointment.count({
      where: { ...tenantWhere, status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
    }),
    prisma.doctorProfile.count({
      where: { ...tenantWhere, user: { is: { isActive: true } } },
    }),
    prisma.patientProfile.count({
      where: { ...tenantWhere, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  // Derived Rates
  const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;
  const noShowRate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 2. Fetch Recent Data for Charts (Last 30 days)
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      ...tenantWhere,
      appointmentDate: { gte: thirtyDaysAgo },
    },
    include: {
      doctor: {
        include: {
          department: true,
        },
      },
    },
    orderBy: { appointmentDate: 'asc' },
  });

  // Aggregate: Appointments by Day
  const apptsByDayMap = new Map<string, number>();
  // Aggregate: Appointments by Department
  const apptsByDeptMap = new Map<string, number>();
  // Aggregate: Appointments by Doctor
  const apptsByDoctorMap = new Map<string, number>();
  // Aggregate: Appointments by Status
  const apptsByStatusMap = new Map<string, number>();

  recentAppointments.forEach((appt) => {
    // Day
    const dayKey = appt.appointmentDate.toISOString().split('T')[0];
    apptsByDayMap.set(dayKey, (apptsByDayMap.get(dayKey) || 0) + 1);

    // Department
    const deptName = appt.doctor.department.name;
    apptsByDeptMap.set(deptName, (apptsByDeptMap.get(deptName) || 0) + 1);

    // Doctor
    const docName = appt.doctor.fullName;
    apptsByDoctorMap.set(docName, (apptsByDoctorMap.get(docName) || 0) + 1);

    // Status
    const statusKey = appt.status;
    apptsByStatusMap.set(statusKey, (apptsByStatusMap.get(statusKey) || 0) + 1);
  });

  // Format maps to arrays for Recharts
  const appointmentsByDay = Array.from(apptsByDayMap.entries()).map(([date, count]) => ({ date, count }));
  const appointmentsByDepartment = Array.from(apptsByDeptMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // sort desc
  const appointmentsByDoctor = Array.from(apptsByDoctorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // top 10
  const appointmentsByStatus = Array.from(apptsByStatusMap.entries()).map(([name, value]) => ({ name, value }));

  return {
    kpis: {
      todayCount,
      upcomingCount,
      completedCount,
      cancelledCount,
      noShowCount,
      newPatientsCount,
      activeDoctorsCount,
      cancellationRate: cancellationRate.toFixed(1),
      noShowRate: noShowRate.toFixed(1),
      completionRate: completionRate.toFixed(1),
    },
    charts: {
      appointmentsByDay,
      appointmentsByDepartment,
      appointmentsByDoctor,
      appointmentsByStatus,
    },
  };
}
