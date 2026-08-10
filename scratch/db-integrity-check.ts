import { prisma } from '../src/server/db/client';

async function runIntegrityCheck() {
  console.log('🔍 Starting Read-Only Database Reliability & Integrity Diagnostic Audit...\n');

  let issueCount = 0;

  // 1. Orphaned Appointments (Non-existent Patient)
  const allPatientIds = (await prisma.patientProfile.findMany({ select: { id: true } })).map((p) => p.id);
  const orphanPatientAppts = await prisma.appointment.findMany({
    where: { patientId: { notIn: allPatientIds } },
  });
  if (orphanPatientAppts.length > 0) {
    console.error(`❌ CRITICAL: Found ${orphanPatientAppts.length} appointments referencing non-existent patients.`);
    issueCount++;
  } else {
    console.log('✅ Check 1: Zero orphaned appointments (PatientProfile integrity verified).');
  }

  // 2. Orphaned Appointments (Non-existent Doctor)
  const allDoctorIds = (await prisma.doctorProfile.findMany({ select: { id: true } })).map((d) => d.id);
  const orphanDoctorAppts = await prisma.appointment.findMany({
    where: { doctorId: { notIn: allDoctorIds } },
  });
  if (orphanDoctorAppts.length > 0) {
    console.error(`❌ CRITICAL: Found ${orphanDoctorAppts.length} appointments referencing non-existent doctors.`);
    issueCount++;
  } else {
    console.log('✅ Check 2: Zero orphaned appointments (DoctorProfile integrity verified).');
  }

  // 3. Active Duplicate Appointment Slots
  const activeAppts = await prisma.appointment.findMany({
    where: { status: { in: ['BOOKED', 'CONFIRMED'] } },
    select: { id: true, doctorId: true, appointmentDate: true, startTime: true },
  });

  const slotMap = new Map<string, string[]>();
  for (const appt of activeAppts) {
    const key = `${appt.doctorId}_${appt.appointmentDate.toISOString().slice(0, 10)}_${appt.startTime}`;
    const existing = slotMap.get(key) || [];
    existing.push(appt.id);
    slotMap.set(key, existing);
  }

  let duplicateSlots = 0;
  for (const [key, apptIds] of slotMap.entries()) {
    if (apptIds.length > 1) {
      console.error(`❌ CRITICAL: Duplicate active slot detected for ${key} (IDs: ${apptIds.join(', ')}).`);
      duplicateSlots++;
      issueCount++;
    }
  }
  if (duplicateSlots === 0) {
    console.log('✅ Check 3: Zero active duplicate slots detected (PostgreSQL partial unique index invariant holds).');
  }

  // 4. Doctors assigned to Inactive or Non-existent Departments
  const activeDeptIds = (await prisma.department.findMany({ where: { isActive: true }, select: { id: true } })).map((d) => d.id);
  const invalidDeptDoctors = await prisma.doctorProfile.findMany({
    where: { departmentId: { notIn: activeDeptIds } },
    select: { id: true, fullName: true, department: { select: { id: true, name: true, isActive: true } } },
  });
  if (invalidDeptDoctors.length > 0) {
    console.warn(`⚠️ WARNING: Found ${invalidDeptDoctors.length} doctors linked to inactive departments.`);
  } else {
    console.log('✅ Check 4: All active doctors are assigned to valid active departments.');
  }

  // 5. Approved Status Inventory Check
  const validStatuses = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const allAppts = await prisma.appointment.findMany({
    select: { id: true, status: true },
  });
  const invalidStatusAppts = allAppts.filter((a) => !validStatuses.includes(a.status));
  if (invalidStatusAppts.length > 0) {
    console.error(`❌ CRITICAL: Found ${invalidStatusAppts.length} appointments with unapproved status.`);
    issueCount++;
  } else {
    console.log(`✅ Check 5: All ${allAppts.length} appointments use approved statuses (BOOKED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW).`);
  }

  // 6. 30-Minute Duration Invariant Check
  const timeInvalidAppts = await prisma.appointment.findMany({
    select: { id: true, startTime: true, endTime: true },
  });

  let invalidDurations = 0;
  for (const appt of timeInvalidAppts) {
    const parseMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startM = parseMin(appt.startTime);
    const endM = parseMin(appt.endTime);
    if (endM - startM !== 30) {
      console.error(`❌ ERROR: Appointment ${appt.id} duration is not 30 minutes (${appt.startTime} -> ${appt.endTime}).`);
      invalidDurations++;
      issueCount++;
    }
  }

  if (invalidDurations === 0) {
    console.log('✅ Check 6: All appointments enforce exact 30-minute durations.');
  }

  console.log(`\n🎉 Diagnostic complete. Total Critical Issues Found: ${issueCount}`);
}

runIntegrityCheck()
  .catch((e) => {
    console.error('Diagnostic failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
