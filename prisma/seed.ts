import { PrismaClient, Role, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PRODUCTION_SEED) {
    console.error('❌ SEED ABORTED: Running seed against NODE_ENV=production is forbidden by default.');
    process.exit(1);
  }

  console.log('🌱 Starting database seeding with fictional development data...');

  // 1. Clean existing data (in reverse dependency order)
  await prisma.appointment.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.weeklyAvailability.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // Default hashed password for fictional users
  const defaultPasswordHash = await bcrypt.hash('test123', 10);

  // 2. Create Departments
  const cardiology = await prisma.department.create({
    data: {
      name: 'Cardiology',
      description: 'Comprehensive cardiovascular care and heart disease management.',
      isActive: true,
    },
  });

  const orthopedics = await prisma.department.create({
    data: {
      name: 'Orthopedics',
      description: 'Bone, joint, and musculoskeletal medical care.',
      isActive: true,
    },
  });

  const pediatrics = await prisma.department.create({
    data: {
      name: 'Pediatrics',
      description: 'Infant, child, and adolescent medical care.',
      isActive: true,
    },
  });

  const dermatology = await prisma.department.create({
    data: {
      name: 'Dermatology',
      description: 'Skin, hair, and nail clinical diagnosis and treatment.',
      isActive: true,
    },
  });

  const neurology = await prisma.department.create({
    data: {
      name: 'Neurology',
      description: 'Brain, spinal cord, and nervous system disorders.',
      isActive: true,
    },
  });

  await prisma.department.create({
    data: {
      name: 'General Medicine',
      description: 'Primary medical care, health checkups, and general consultation.',
      isActive: true,
    },
  });

  console.log('✅ Created 6 medical departments.');

  // 3. Create Admin User
  await prisma.user.create({
    data: {
      email: 'admin@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Created Admin user (admin@hospital.com).');

  // 4. Create Doctor 1 (Cardiology)
  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'dr.smith@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.DOCTOR,
      isActive: true,
      doctorProfile: {
        create: {
          fullName: 'Dr. Jane Smith',
          phoneNumber: '+91 98765 43210',
          qualification: 'MBBS, MD Cardiology (AIIMS)',
          experienceYears: 12,
          bio: 'Senior Interventional Cardiologist specializing in preventive heart health.',
          departmentId: cardiology.id,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctor1Profile = doctorUser1.doctorProfile!;

  // Doctor 1 Weekly Availability (Mon - Fri, 09:00 - 13:00)
  for (let day = 1; day <= 5; day++) {
    await prisma.weeklyAvailability.create({
      data: {
        doctorId: doctor1Profile.id,
        dayOfWeek: day,
        startTime: '09:00:00',
        endTime: '13:00:00',
        slotDurationMinutes: 30,
      },
    });
  }

  // Doctor 1 Blocked Date Exception
  await prisma.blockedDate.create({
    data: {
      doctorId: doctor1Profile.id,
      startDate: new Date('2026-08-25'),
      endDate: new Date('2026-08-25'),
      reason: 'Attending Medical Conference',
    },
  });

  // 5. Create Doctor 2 (Orthopedics)
  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'dr.johnson@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.DOCTOR,
      isActive: true,
      doctorProfile: {
        create: {
          fullName: 'Dr. Robert Johnson',
          phoneNumber: '+91 98765 43211',
          qualification: 'MBBS, MS Orthopedics',
          experienceYears: 8,
          bio: 'Orthopedic Surgeon specializing in joint replacement and sports injury rehabilitation.',
          departmentId: orthopedics.id,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctor2Profile = doctorUser2.doctorProfile!;

  // Doctor 2 Weekly Availability (Mon - Fri, 10:00 - 16:00)
  for (let day = 1; day <= 5; day++) {
    await prisma.weeklyAvailability.create({
      data: {
        doctorId: doctor2Profile.id,
        dayOfWeek: day,
        startTime: '10:00:00',
        endTime: '16:00:00',
        slotDurationMinutes: 30,
      },
    });
  }

  console.log('✅ Created 2 Doctor users with availability schedules.');

  // 6. Create Patient 1
  const patientUser1 = await prisma.user.create({
    data: {
      email: 'patient.alice@example.com',
      passwordHash: defaultPasswordHash,
      role: Role.PATIENT,
      isActive: true,
      patientProfile: {
        create: {
          fullName: 'Alice Walker',
          phoneNumber: '+91 91234 56789',
          dateOfBirth: new Date('1992-05-14'),
          gender: 'Female',
          emergencyContact: '+91 91234 50000',
        },
      },
    },
    include: { patientProfile: true },
  });

  const patient1Profile = patientUser1.patientProfile!;

  // 7. Create Patient 2
  const patientUser2 = await prisma.user.create({
    data: {
      email: 'patient.bob@example.com',
      passwordHash: defaultPasswordHash,
      role: Role.PATIENT,
      isActive: true,
      patientProfile: {
        create: {
          fullName: 'Bob Martinez',
          phoneNumber: '+91 91234 56790',
          dateOfBirth: new Date('1985-11-20'),
          gender: 'Male',
          emergencyContact: '+91 91234 51111',
        },
      },
    },
    include: { patientProfile: true },
  });

  const patient2Profile = patientUser2.patientProfile!;

  console.log('✅ Created 2 Patient users.');

  // 8. Create Sample Fictional Appointments
  await prisma.appointment.create({
    data: {
      patientId: patient1Profile.id,
      doctorId: doctor1Profile.id,
      appointmentDate: new Date('2026-08-15'),
      startTime: '09:00:00',
      endTime: '09:30:00',
      status: AppointmentStatus.BOOKED,
      reason: 'Routine annual cardiology health checkup.',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2Profile.id,
      doctorId: doctor1Profile.id,
      appointmentDate: new Date('2026-08-15'),
      startTime: '09:30:00',
      endTime: '10:00:00',
      status: AppointmentStatus.CONFIRMED,
      reason: 'Chest discomfort evaluation.',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1Profile.id,
      doctorId: doctor2Profile.id,
      appointmentDate: new Date('2026-08-10'),
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: AppointmentStatus.COMPLETED,
      reason: 'Knee joint pain consultation.',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2Profile.id,
      doctorId: doctor1Profile.id,
      appointmentDate: new Date('2026-08-15'),
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Personal emergency.',
      cancelledBy: Role.PATIENT,
    },
  });

  console.log('✅ Created sample appointments across statuses (BOOKED, CONFIRMED, COMPLETED, CANCELLED).');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
