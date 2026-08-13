import {
  PrismaClient,
  Role,
  AppointmentStatus,
  ContentStatus,
  HomepageSectionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

let tenantIdForExtension: string | undefined;

const EXCLUDED_MODELS = ['HospitalProfile', 'Notification', 'DoctorSpeciality', 'DoctorCentre', 'CentreSpeciality', 'CentreService'];

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (tenantIdForExtension && !EXCLUDED_MODELS.includes(model as string)) {
          (args.data as any).tenantId = tenantIdForExtension;
        }
        return query(args);
      },
      async createMany({ model, args, query }) {
        if (tenantIdForExtension && !EXCLUDED_MODELS.includes(model as string)) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map(d => ({ ...d, tenantId: tenantIdForExtension } as any));
          } else {
            (args.data as any).tenantId = tenantIdForExtension;
          }
        }
        return query(args);
      }
    }
  }
});

async function cleanDatabase() {
  await prisma.packageInformationRequest.deleteMany();
  await prisma.internationalPatientEnquiry.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.appointmentEnquiry.deleteMany();
  await prisma.doctorSpeciality.deleteMany();
  await prisma.doctorCentre.deleteMany();
  await prisma.centreSpeciality.deleteMany();
  await prisma.centreService.deleteMany();
  await prisma.successStory.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.healthArticle.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.patientResource.deleteMany();
  await prisma.insurancePartner.deleteMany();
  await prisma.internationalPageContent.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.healthPackage.deleteMany();
  await prisma.hospitalService.deleteMany();
  await prisma.centreOfExcellence.deleteMany();
  await prisma.speciality.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.leadershipMember.deleteMany();
  await prisma.hospitalLocation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.weeklyAvailability.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospitalProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function seedHospital(prefix: string, domain: string, defaultPasswordHash: string) {
  const tenant = await prisma.hospitalProfile.create({
    data: {
      hospitalName: `${prefix} Hospital`,
      customDomain: domain,
      primaryColor: prefix === 'Alpha' ? '#0ea5e9' : '#10b981',
      isActive: true,
    },
  });
  tenantIdForExtension = tenant.id;

  // Admin
  await prisma.user.create({
    data: {
      email: prefix === 'Alpha' ? 'admin@hospital.com' : `admin@${domain}`,
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      tenantId: tenant.id
    },
  });

  // Departments
  const deptNames = ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology'];
  const departments = [];
  for (const name of deptNames) {
    const dept = await prisma.department.create({
      data: {
        name: name,
        slug: name.toLowerCase(),
        isActive: true,
        contentStatus: ContentStatus.PUBLISHED,
      }
    });
    departments.push(dept);
  }

  // Doctors (5)
  const doctors = [];
  for (let i = 1; i <= 5; i++) {
    let email = `doctor${i}@${domain}`;
    if (prefix === 'Alpha') {
      if (i === 1) email = 'dr.smith@hospital.com';
      if (i === 2) email = 'dr.johnson@hospital.com';
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        role: Role.DOCTOR,
        isActive: true,
        tenantId: tenant.id
      }
    });

    const doc = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: `Dr. ${prefix} Doc ${i}`,
        slug: `dr-${prefix.toLowerCase()}-doc-${i}`,
        phoneNumber: `+91 90000 0000${i}`,
        qualification: 'MBBS',
        departmentId: departments[i % departments.length].id,
        contentStatus: ContentStatus.PUBLISHED,
        tenantId: tenant.id
      }
    });

    // Availability
    for (let day = 1; day <= 5; day++) {
      await prisma.weeklyAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '17:00:00',
          slotDurationMinutes: 30,
          tenantId: tenant.id
        }
      });
    }

    doctors.push(doc);
  }

  // Patients (10)
  const patients = [];
  for (let i = 1; i <= 10; i++) {
    let email = `patient${i}@${domain}`;
    if (prefix === 'Alpha') {
      if (i === 1) email = 'patient.alice@example.com';
      if (i === 2) email = 'patient.bob@example.com';
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        role: Role.PATIENT,
        isActive: true,
        tenantId: tenant.id
      }
    });

    const pat = await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: `${prefix} Patient ${i}`,
        phoneNumber: `+91 80000 0000${i}`,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Other',
        tenantId: tenant.id
      }
    });
    patients.push(pat);
  }

  // Appointments
  const statuses = [
    AppointmentStatus.BOOKED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ];

  for (let i = 0; i < 20; i++) {
    await prisma.appointment.create({
      data: {
        patientId: patients[i % patients.length].id,
        doctorId: doctors[i % doctors.length].id,
        appointmentDate: new Date(Date.now() + (i * 86400000)),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: statuses[i % statuses.length],
        tenantId: tenant.id
      }
    });
  }
}

async function main() {
  const alreadySeeded = await prisma.user.findFirst({ where: { email: 'admin@hospital.com' } });
  if (alreadySeeded) {
    console.log('Database already seeded. Skipping to preserve data.');
    return;
  }

  console.log('Starting full UAT seed...');
  await cleanDatabase();

  const defaultPasswordHash = await bcrypt.hash('test123', 10);

  await seedHospital('Alpha', 'hospital-a.com', defaultPasswordHash);
  await seedHospital('Beta', 'hospital-b.com', defaultPasswordHash);

  console.log('Seed complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
