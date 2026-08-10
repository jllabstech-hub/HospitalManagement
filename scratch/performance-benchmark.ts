import { computeAvailableSlots } from '@/features/appointments/domain/slot-engine';
import { searchDoctors } from '@/features/doctors/queries';
import { getAvailableSlotsForDoctorDate } from '@/features/appointments/services/get-available-slots';
import { getAdminAppointments, getDoctorAppointments } from '@/features/appointments/services/manage-appointments';
import { prisma } from '@/server/db/client';

async function runPerformanceBenchmark() {
  console.log('⚡ Starting Phase 7E Performance & Scalability Benchmark Audit...\n');

  // 1. Pure Slot Engine Micro-Benchmark (10,000 Executions)
  const sampleSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00:00', endTime: '13:00:00', slotDurationMinutes: 30 },
    { id: '2', dayOfWeek: 1, startTime: '14:00:00', endTime: '18:00:00', slotDurationMinutes: 30 },
  ];
  const sampleBlocked = [
    { id: 'b1', startDate: '2026-12-20', endDate: '2026-12-20', isFullDay: false, startTime: '11:00:00', endTime: '12:00:00', reason: 'Lunch' },
  ];
  const sampleAppts = [
    { id: 'a1', appointmentDate: '2026-12-20', startTime: '09:30:00', endTime: '10:00:00', status: 'BOOKED' as const },
    { id: 'a2', appointmentDate: '2026-12-20', startTime: '14:30:00', endTime: '15:00:00', status: 'CONFIRMED' as const },
  ];

  const t0 = performance.now();
  for (let i = 0; i < 10000; i++) {
    computeAvailableSlots({
      date: '2026-12-20',
      weeklyAvailability: sampleSchedule,
      blockedDates: sampleBlocked,
      activeAppointments: sampleAppts,
      currentDate: '2026-08-10',
    });
  }
  const t1 = performance.now();
  const slotEngineTotalMs = (t1 - t0).toFixed(2);
  const slotEnginePerOpMs = ((t1 - t0) / 10000).toFixed(4);
  console.log(`📊 1. Pure Slot Engine Micro-Benchmark (10,000 iterations):`);
  console.log(`   - Total Time: ${slotEngineTotalMs} ms`);
  console.log(`   - Average Per Execution: ${slotEnginePerOpMs} ms\n`);

  // 2. Doctor Search Database Query Benchmark
  const t2 = performance.now();
  const searchRes = await searchDoctors({ page: 1, limit: 20 });
  const t3 = performance.now();
  console.log(`📊 2. Doctor Search Query Benchmark (searchDoctors):`);
  console.log(`   - Result Count: ${searchRes.doctors.length} doctors / Total: ${searchRes.totalCount}`);
  console.log(`   - Database Query Latency: ${(t3 - t2).toFixed(2)} ms\n`);

  // 3. Slot Retrieval Database & Compute Benchmark
  const firstDoc = searchRes.doctors[0];
  if (firstDoc) {
    const t4 = performance.now();
    const slotRes = await getAvailableSlotsForDoctorDate(firstDoc.id, '2026-12-20');
    const t5 = performance.now();
    console.log(`📊 3. Slot Retrieval Service Benchmark (getAvailableSlotsForDoctorDate):`);
    console.log(`   - Doctor: ${firstDoc.fullName} (ID: ${firstDoc.id})`);
    console.log(`   - Computed Available Slots: ${slotRes.slots.length}`);
    console.log(`   - Total Service Latency: ${(t5 - t4).toFixed(2)} ms\n`);
  }

  // 4. Admin Master Appointments Query Benchmark
  const t6 = performance.now();
  const adminRes = await getAdminAppointments({
    page: 1,
    limit: 20,
  });
  const t7 = performance.now();
  console.log(`📊 4. Admin Appointments Query Benchmark (getAdminAppointments):`);
  console.log(`   - Returned Appointments: ${adminRes.appointments.length}`);
  console.log(`   - Database Query Latency: ${(t7 - t6).toFixed(2)} ms\n`);

  // 5. Doctor Dashboard Appointments Query Benchmark
  const docUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' }, include: { doctorProfile: true } });
  if (docUser && docUser.doctorProfile) {
    const t8 = performance.now();
    const docRes = await getDoctorAppointments(docUser.doctorProfile.id, {
      dateStr: '2026-08-15',
    });
    const t9 = performance.now();
    console.log(`📊 5. Doctor Appointments Query Benchmark (getDoctorAppointments):`);
    console.log(`   - Returned Queue Items: ${docRes.appointments.length}`);
    console.log(`   - Database Query Latency: ${(t9 - t8).toFixed(2)} ms\n`);
  }

  console.log('🎉 Performance benchmark complete!');
}

runPerformanceBenchmark()
  .catch((e) => {
    console.error('Performance benchmark error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
