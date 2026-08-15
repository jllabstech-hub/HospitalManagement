import {
  PrismaClient,
  Role,
  AppointmentStatus,
  ContentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

let tenantIdForExtension: string | undefined;

const EXCLUDED_MODELS = ['HospitalProfile', 'Notification'];

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (tenantIdForExtension && !EXCLUDED_MODELS.includes(model as string)) {
          const data = args.data as Record<string, unknown>;
          data.tenantId = tenantIdForExtension;
        }
        return query(args);
      },
      async createMany({ model, args, query }) {
        if (tenantIdForExtension && !EXCLUDED_MODELS.includes(model as string)) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d) => {
              const record = d as Record<string, unknown>;
              return { ...record, tenantId: tenantIdForExtension };
            }) as typeof args.data;
          } else {
            const data = args.data as Record<string, unknown>;
            data.tenantId = tenantIdForExtension;
          }
        }
        return query(args);
      }
    }
  }
});

async function cleanDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.authAttempt.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.notification.deleteMany();
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
      hospitalName: prefix === 'Alpha' ? 'CarePulse Super Speciality Hospital' : `${prefix} Hospital`,
      customDomain: domain,
      subdomain: prefix === 'Alpha' ? 'carepulse' : `${prefix.toLowerCase()}`,
      timezone: 'Asia/Kolkata',
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
        tenantId: tenant.id,
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

    const isJane = prefix === 'Alpha' && i === 1;
    const isRobert = prefix === 'Alpha' && i === 2;
    const doc = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: isJane ? 'Dr. Jane Smith' : isRobert ? 'Dr. Robert Johnson' : `Dr. ${prefix} Doc ${i}`,
        slug: isJane ? 'dr-jane-smith' : isRobert ? 'dr-robert-johnson' : `dr-${prefix.toLowerCase()}-doc-${i}`,
        phoneNumber: `+91 90000 0000${i}`,
        qualification: isJane ? 'MBBS, MD' : 'MBBS',
        departmentId: isJane ? departments[0].id : departments[i % departments.length].id,
        contentStatus: ContentStatus.PUBLISHED,
        tenantId: tenant.id
      }
    });

    // Availability every day so E2E can discover a future slot regardless of weekday.
    for (let day = 0; day <= 6; day++) {
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

  await prisma.speciality.create({
    data: {
      name: `${prefix} Exclusive Care`,
      slug: `${prefix.toLowerCase()}-exclusive-care`,
      shortDescription: `Care unique to ${prefix}`,
      isActive: true,
      contentStatus: ContentStatus.PUBLISHED,
      tenantId: tenant.id,
    },
  });
  await prisma.hospitalService.create({
    data: {
      name: `${prefix} Lab Service`,
      slug: `${prefix.toLowerCase()}-lab-service`,
      shortDescription: 'Tenant-scoped diagnostics',
      isActive: true,
      contentStatus: ContentStatus.PUBLISHED,
      tenantId: tenant.id,
    },
  });
  await prisma.healthPackage.create({
    data: {
      name: `${prefix} Wellness Package`,
      slug: `${prefix.toLowerCase()}-wellness-package`,
      description: 'Tenant-scoped package',
      isActive: true,
      contentStatus: ContentStatus.PUBLISHED,
      tenantId: tenant.id,
    },
  });

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

  // Appointments are omitted from deterministic E2E/unit seeds so slot
  // discovery does not depend on leftover 10:00 bookings.
  if (process.env.E2E_TEST_MODE !== 'true' && process.env.SEED_SAMPLE_APPOINTMENTS === 'true') {
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
          startTime: '16:00:00',
          endTime: '16:30:00',
          status: statuses[i % statuses.length],
          tenantId: tenant.id
        }
      });
    }
  }
}

async function ensureDemoPublicContent(tenantId: string) {
  tenantIdForExtension = tenantId;
  const published = { contentStatus: ContentStatus.PUBLISHED, isActive: true, tenantId };

  await prisma.speciality.upsert({
    where: { tenantId_slug: { tenantId, slug: 'interventional-cardiology' } },
    update: { ...published, name: 'Interventional Cardiology' },
    create: {
      ...published,
      name: 'Interventional Cardiology',
      slug: 'interventional-cardiology',
      shortDescription: 'Cath lab, angioplasty, and heart-failure care.',
    },
  });

  await prisma.centreOfExcellence.upsert({
    where: { tenantId_slug: { tenantId, slug: 'heart-vascular-centre' } },
    update: { ...published, name: 'Heart & Vascular Centre' },
    create: {
      ...published,
      name: 'Heart & Vascular Centre',
      slug: 'heart-vascular-centre',
      shortDescription: 'Dedicated cardiac care with 24/7 cath lab coverage.',
    },
  });

  await prisma.hospitalService.upsert({
    where: { tenantId_slug: { tenantId, slug: 'outpatient-consultations' } },
    update: { ...published, name: 'Outpatient Consultations' },
    create: {
      ...published,
      name: 'Outpatient Consultations',
      slug: 'outpatient-consultations',
      shortDescription: 'Consultant OPD appointments across major specialities.',
    },
  });

  await prisma.healthPackage.upsert({
    where: { tenantId_slug: { tenantId, slug: 'essential-heart-screening' } },
    update: { ...published, name: 'Essential Heart Screening' },
    create: {
      ...published,
      name: 'Essential Heart Screening',
      slug: 'essential-heart-screening',
      description: 'ECG, lipid profile, cardiac consultation and TMT.',
    },
  });

  await prisma.healthArticle.upsert({
    where: { tenantId_slug: { tenantId, slug: 'understanding-heart-health-demo' } },
    update: {
      title: 'Understanding Heart Health',
      content: 'Demo article on heart health for the public library.',
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      tenantId,
      title: 'Understanding Heart Health',
      slug: 'understanding-heart-health-demo',
      content: 'Demo article on heart health for the public library.',
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.newsArticle.upsert({
    where: { tenantId_slug: { tenantId, slug: 'new-cardiac-cath-lab-demo' } },
    update: {
      title: 'New Cardiac Cath Lab',
      content: 'Demo news update about the cardiac catheterization lab.',
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      tenantId,
      title: 'New Cardiac Cath Lab',
      slug: 'new-cardiac-cath-lab-demo',
      content: 'Demo news update about the cardiac catheterization lab.',
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.successStory.upsert({
    where: { tenantId_slug: { tenantId, slug: 'cardiac-recovery-success-demo' } },
    update: {
      title: 'Cardiac Recovery Success',
      content: 'Demo recovery journey for public success stories.',
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      tenantId,
      title: 'Cardiac Recovery Success',
      slug: 'cardiac-recovery-success-demo',
      content: 'Demo recovery journey for public success stories.',
      patientDisplayName: 'Demo Patient',
      isAnonymizedDemo: true,
      contentStatus: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.hospitalLocation.upsert({
    where: { tenantId_slug: { tenantId, slug: 'carepulse-main-campus' } },
    update: { ...published, name: 'CarePulse Main Campus' },
    create: {
      ...published,
      name: 'CarePulse Main Campus',
      slug: 'carepulse-main-campus',
      address: '124 CarePulse Avenue, Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      isPrimary: true,
    },
  });

  await prisma.leadershipMember.upsert({
    where: { tenantId_slug: { tenantId, slug: 'dr-ananya-rao' } },
    update: { ...published, name: 'Dr Ananya Rao', designation: 'Medical Director' },
    create: {
      ...published,
      name: 'Dr Ananya Rao',
      slug: 'dr-ananya-rao',
      designation: 'Medical Director',
      shortBio: 'Leads clinical governance and patient safety.',
    },
  });

  await prisma.facility.upsert({
    where: { tenantId_slug: { tenantId, slug: 'modular-operation-theatres' } },
    update: { ...published, name: 'Modular Operation Theatres' },
    create: {
      ...published,
      name: 'Modular Operation Theatres',
      slug: 'modular-operation-theatres',
      category: 'Surgical',
      description: 'Theatres, ICUs and diagnostic imaging for advanced procedures.',
    },
  });

  await prisma.insurancePartner.upsert({
    where: { tenantId_slug: { tenantId, slug: 'demo-health-insurance' } },
    update: { ...published, name: 'Demo Health Insurance' },
    create: {
      ...published,
      name: 'Demo Health Insurance',
      slug: 'demo-health-insurance',
      description: 'Cashless and reimbursement support for eligible outpatient visits.',
    },
  });

  await prisma.internationalPageContent.upsert({
    where: { tenantId },
    update: {
      title: 'International patients',
      introduction: 'Coordinators, visa assistance and remote opinion for patients travelling to Bengaluru.',
      coordinatorContact: 'international@hospital.com',
    },
    create: {
      tenantId,
      title: 'International patients',
      introduction: 'Coordinators, visa assistance and remote opinion for patients travelling to Bengaluru.',
      howToRequest: 'Share medical reports and travel dates with the international desk.',
      secondOpinion: 'Remote second-opinion reviews are arranged with treating consultants.',
      requiredDocuments: 'Passport, prior medical records, and treating-doctor summary.',
      travelInformation: 'Bengaluru International Airport is the nearest arrival point.',
      accommodationInfo: 'Guest-house and partner hotel options are shared after confirmation.',
      coordinatorContact: 'international@hospital.com',
    },
  });

  const jane = await prisma.doctorProfile.findFirst({
    where: { tenantId, user: { email: 'dr.smith@hospital.com' } },
  });
  if (jane) {
    await prisma.doctorProfile.update({
      where: { id: jane.id },
      data: {
        fullName: 'Dr. Jane Smith',
        slug: 'dr-jane-smith',
        publicDisplayName: 'Dr. Jane Smith',
        contentStatus: ContentStatus.PUBLISHED,
        qualification: jane.qualification || 'MBBS, MD',
      },
    });
  }
  const robert = await prisma.doctorProfile.findFirst({
    where: { tenantId, user: { email: 'dr.johnson@hospital.com' } },
  });
  if (robert) {
    await prisma.doctorProfile.update({
      where: { id: robert.id },
      data: {
        fullName: 'Dr. Robert Johnson',
        slug: 'dr-robert-johnson',
        publicDisplayName: 'Dr. Robert Johnson',
        contentStatus: ContentStatus.PUBLISHED,
      },
    });
  }
  await prisma.department.updateMany({
    where: { tenantId, name: { equals: 'Cardiology', mode: 'insensitive' } },
    data: { contentStatus: ContentStatus.PUBLISHED, isActive: true },
  });

  const orphanDoctors = await prisma.user.findMany({
    where: { role: Role.DOCTOR, doctorProfile: { is: null } },
    select: { id: true },
  });
  if (orphanDoctors.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: orphanDoctors.map((u) => u.id) } } });
  }

  console.log('Ensured demo public CMS content for tenant', tenantId);
}

async function ensureTenantHostnames() {
  const alphaAdmin = await prisma.user.findFirst({
    where: { email: 'admin@hospital.com' },
    select: { tenantId: true },
  });
  if (alphaAdmin?.tenantId) {
    const profile = await prisma.hospitalProfile.findUnique({
      where: { id: alphaAdmin.tenantId },
      select: { id: true, customDomain: true, subdomain: true },
    });
    if (profile && (!profile.customDomain || !profile.subdomain)) {
      await prisma.hospitalProfile.update({
        where: { id: profile.id },
        data: {
          customDomain: profile.customDomain ?? 'hospital-a.com',
          subdomain: profile.subdomain ?? 'carepulse',
        },
      });
    }
  }

  const beta = await prisma.hospitalProfile.findFirst({
    where: { hospitalName: 'Beta Hospital' },
    select: { id: true, customDomain: true, subdomain: true },
  });
  if (beta && (!beta.customDomain || !beta.subdomain)) {
    await prisma.hospitalProfile.update({
      where: { id: beta.id },
      data: {
        customDomain: beta.customDomain ?? 'hospital-b.com',
        subdomain: beta.subdomain ?? 'beta',
      },
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Refusing to run seed in production. Set ALLOW_DESTRUCTIVE_SEED=true only for disposable environments.');
  }

  const alreadySeeded = await prisma.user.findFirst({ where: { email: 'admin@hospital.com' } });
  if (alreadySeeded && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    console.log('Database already seeded. Skipping destructive reset.');
    const tenantId = alreadySeeded.tenantId;
    if (tenantId) {
      await ensureDemoPublicContent(tenantId);
    }
    await ensureTenantHostnames();
    return;
  }

  console.log('Starting full UAT seed...');
  await cleanDatabase();

  const defaultPasswordHash = await bcrypt.hash('test123', 10);

  await seedHospital('Alpha', 'hospital-a.com', defaultPasswordHash);
  await seedHospital('Beta', 'hospital-b.com', defaultPasswordHash);

  const alphaAdmin = await prisma.user.findFirst({ where: { email: 'admin@hospital.com' } });
  if (alphaAdmin?.tenantId) {
    await ensureDemoPublicContent(alphaAdmin.tenantId);
  }
  await ensureTenantHostnames();

  console.log('Seed complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
