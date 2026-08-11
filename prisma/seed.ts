import {
  PrismaClient,
  Role,
  AppointmentStatus,
  ContentStatus,
  HomepageSectionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  await prisma.hospitalProfile.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.weeklyAvailability.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PRODUCTION_SEED) {
    console.error('❌ SEED ABORTED: Running seed against NODE_ENV=production is forbidden by default.');
    process.exit(1);
  }

  console.log('🌱 Starting database seeding with fictional development data...');

  await cleanDatabase();
  console.log('🧹 Cleaned existing records.');

  const defaultPasswordHash = await bcrypt.hash('test123', 10);
  const publishedAt = new Date('2026-08-01');

  // ─── Hospital CMS (demo) ───────────────────────────────────────────────

  await prisma.hospitalProfile.create({
    data: {
      hospitalName: 'CarePulse Hospital',
      legalName: 'CarePulse Healthcare Pvt. Ltd. (Demo)',
      shortDescription:
        'A multi-speciality hospital in Bengaluru offering compassionate, evidence-based care.',
      fullDescription:
        'CarePulse Hospital is a fictional demo facility seeded for development. It showcases public website content, appointment booking, and admin CMS workflows.',
      tagline: 'Exceptional Care. Right When You Need It.',
      phone: '+91 80 4567 8900',
      emergencyPhone: '+91 80 4567 8999',
      email: 'care@carepulse.hospital',
      addressLine1: '12 Health Avenue',
      addressLine2: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      timezone: 'Asia/Kolkata',
      workingHours: 'Mon–Sat · 8:00 AM – 8:00 PM IST',
      mission: 'Deliver accessible, patient-centred healthcare with clinical excellence.',
      vision: 'To be Bengaluru\'s most trusted community hospital.',
      values: 'Compassion · Integrity · Safety · Innovation',
      isActive: true,
    },
  });

  await prisma.hospitalLocation.create({
    data: {
      name: 'CarePulse Main Campus',
      slug: 'carepulse-main-campus',
      address: '12 Health Avenue, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+91 80 4567 8900',
      emergencyPhone: '+91 80 4567 8999',
      email: 'care@carepulse.hospital',
      isPrimary: true,
      contentStatus: ContentStatus.PUBLISHED,
      isActive: true,
    },
  });

  await prisma.leadershipMember.createMany({
    data: [
      {
        name: 'Dr. Ananya Rao (Demo)',
        slug: 'dr-ananya-rao',
        designation: 'Medical Director',
        shortBio: 'Demo leadership profile for development and CMS preview.',
        fullBio:
          'Dr. Ananya Rao represents fictional hospital leadership. Content is seeded for demonstration only.',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        name: 'Mr. Vikram Menon (Demo)',
        slug: 'vikram-menon',
        designation: 'Chief Operating Officer',
        shortBio: 'Oversees hospital operations and patient experience (demo profile).',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.facility.createMany({
    data: [
      {
        name: '24×7 Emergency & Trauma (Demo)',
        slug: 'emergency-trauma',
        description: 'Round-the-clock emergency care with triage and resuscitation bays.',
        category: 'Emergency',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        name: 'Advanced Diagnostic Imaging (Demo)',
        slug: 'diagnostic-imaging',
        description: 'MRI, CT, ultrasound, and digital X-ray services.',
        category: 'Diagnostics',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        name: 'Modular Operation Theatres (Demo)',
        slug: 'operation-theatres',
        description: 'Sterile modular OTs for elective and emergency surgeries.',
        category: 'Surgical',
        displayOrder: 3,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  // ─── Departments ───────────────────────────────────────────────────────

  const departmentDefs = [
    {
      name: 'Cardiology',
      slug: 'cardiology',
      description: 'Comprehensive cardiovascular care and heart disease management.',
      displayOrder: 1,
      isFeatured: true,
    },
    {
      name: 'Orthopedics',
      slug: 'orthopedics',
      description: 'Bone, joint, and musculoskeletal medical care.',
      displayOrder: 2,
      isFeatured: true,
    },
    {
      name: 'Pediatrics',
      slug: 'pediatrics',
      description: 'Infant, child, and adolescent medical care.',
      displayOrder: 3,
      isFeatured: false,
    },
    {
      name: 'Dermatology',
      slug: 'dermatology',
      description: 'Skin, hair, and nail clinical diagnosis and treatment.',
      displayOrder: 4,
      isFeatured: false,
    },
    {
      name: 'Neurology',
      slug: 'neurology',
      description: 'Brain, spinal cord, and nervous system disorders.',
      displayOrder: 5,
      isFeatured: true,
    },
    {
      name: 'General Medicine',
      slug: 'general-medicine',
      description: 'Primary medical care, health checkups, and general consultation.',
      displayOrder: 6,
      isFeatured: false,
    },
  ];

  const departments: Record<string, { id: string }> = {};
  for (const dept of departmentDefs) {
    const created = await prisma.department.create({
      data: {
        name: dept.name,
        slug: dept.slug,
        description: dept.description,
        shortDescription: dept.description,
        displayOrder: dept.displayOrder,
        isFeatured: dept.isFeatured,
        contentStatus: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });
    departments[dept.slug] = created;
  }

  const cardiology = departments.cardiology;
  const orthopedics = departments.orthopedics;
  const pediatrics = departments.pediatrics;
  const dermatology = departments.dermatology;
  const neurology = departments.neurology;
  const generalMedicine = departments['general-medicine'];

  console.log('✅ Created 6 medical departments.');

  // ─── Specialities ──────────────────────────────────────────────────────

  const specialityCardiology = await prisma.speciality.create({
    data: {
      name: 'Interventional Cardiology',
      slug: 'interventional-cardiology',
      shortDescription: 'Minimally invasive heart procedures and catheter-based treatments.',
      departmentId: cardiology.id,
      displayOrder: 1,
      isFeatured: true,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  const specialityOrthopedics = await prisma.speciality.create({
    data: {
      name: 'Joint Replacement',
      slug: 'joint-replacement',
      shortDescription: 'Hip, knee, and shoulder replacement surgery and rehabilitation.',
      departmentId: orthopedics.id,
      displayOrder: 2,
      isFeatured: true,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  const specialityPediatrics = await prisma.speciality.create({
    data: {
      name: 'Pediatric Care',
      slug: 'pediatric-care',
      shortDescription: 'Well-child visits, vaccinations, and paediatric acute care.',
      departmentId: pediatrics.id,
      displayOrder: 3,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  await prisma.speciality.create({
    data: {
      name: 'Dermatologic Surgery',
      slug: 'dermatologic-surgery',
      shortDescription: 'Cosmetic and medical skin procedures.',
      departmentId: dermatology.id,
      displayOrder: 4,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  const specialityNeurology = await prisma.speciality.create({
    data: {
      name: 'Neuro Rehabilitation',
      slug: 'neuro-rehabilitation',
      shortDescription: 'Stroke recovery and neurological rehabilitation programmes.',
      departmentId: neurology.id,
      displayOrder: 5,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  await prisma.speciality.create({
    data: {
      name: 'General Health Checkups',
      slug: 'general-health-checkups',
      shortDescription: 'Preventive screenings and primary care consultations.',
      departmentId: generalMedicine.id,
      displayOrder: 6,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  // ─── Centres of Excellence ─────────────────────────────────────────────

  const heartCentre = await prisma.centreOfExcellence.create({
    data: {
      name: 'Heart & Vascular Centre (Demo)',
      slug: 'heart-vascular-centre',
      shortDescription: 'Integrated cardiac diagnostics, intervention, and recovery.',
      fullDescription: 'Demo centre linking cardiology specialities and featured cardiologists.',
      clinicalFocus: 'Coronary care, arrhythmia management, preventive cardiology',
      displayOrder: 1,
      isFeatured: true,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  const orthoCentre = await prisma.centreOfExcellence.create({
    data: {
      name: 'Orthopedic & Sports Medicine Centre (Demo)',
      slug: 'orthopedic-sports-centre',
      shortDescription: 'Joint care, sports injuries, and musculoskeletal rehabilitation.',
      displayOrder: 2,
      isFeatured: true,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  await prisma.centreSpeciality.createMany({
    data: [
      { centreId: heartCentre.id, specialityId: specialityCardiology.id },
      { centreId: orthoCentre.id, specialityId: specialityOrthopedics.id },
      { centreId: orthoCentre.id, specialityId: specialityNeurology.id },
    ],
  });

  // ─── Hospital Services ─────────────────────────────────────────────────

  const services = await Promise.all([
    prisma.hospitalService.create({
      data: {
        name: 'Outpatient Consultations (Demo)',
        slug: 'outpatient-consultations',
        shortDescription: 'Scheduled specialist and general medicine consultations.',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
    }),
    prisma.hospitalService.create({
      data: {
        name: 'Laboratory Services (Demo)',
        slug: 'laboratory-services',
        shortDescription: 'Pathology, biochemistry, and microbiology testing.',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
    }),
    prisma.hospitalService.create({
      data: {
        name: 'Pharmacy (Demo)',
        slug: 'pharmacy',
        shortDescription: 'In-hospital pharmacy with common prescription medicines.',
        displayOrder: 3,
        contentStatus: ContentStatus.PUBLISHED,
      },
    }),
    prisma.hospitalService.create({
      data: {
        name: 'Ambulance & Patient Transport (Demo)',
        slug: 'ambulance-transport',
        shortDescription: 'Emergency and non-emergency patient transport within Bengaluru.',
        displayOrder: 4,
        contentStatus: ContentStatus.PUBLISHED,
      },
    }),
  ]);

  await prisma.centreService.createMany({
    data: [
      { centreId: heartCentre.id, serviceId: services[0].id },
      { centreId: heartCentre.id, serviceId: services[1].id },
      { centreId: orthoCentre.id, serviceId: services[0].id },
    ],
  });

  // ─── Health Packages ───────────────────────────────────────────────────

  await prisma.healthPackage.createMany({
    data: [
      {
        name: 'Essential Heart Screening (Demo)',
        slug: 'essential-heart-screening',
        description: 'ECG, lipid profile, and cardiology consult — demo pricing only.',
        price: 4999,
        currency: 'INR',
        duration: 'Same day',
        isDemoPricing: true,
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        name: 'Executive Wellness Panel (Demo)',
        slug: 'executive-wellness-panel',
        description: 'Comprehensive blood work and physician review — demo pricing only.',
        price: 7999,
        currency: 'INR',
        duration: '1–2 days',
        isDemoPricing: true,
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  // ─── Users ─────────────────────────────────────────────────────────────

  await prisma.user.create({
    data: {
      email: 'admin@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Created Admin user (admin@hospital.com).');

  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'dr.smith@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.DOCTOR,
      isActive: true,
      doctorProfile: {
        create: {
          fullName: 'Dr. Jane Smith',
          slug: 'dr-jane-smith',
          phoneNumber: '+91 98765 43210',
          qualification: 'MBBS, MD Cardiology (AIIMS)',
          experienceYears: 12,
          bio: 'Senior Interventional Cardiologist specializing in preventive heart health.',
          publicDisplayName: 'Dr. Jane Smith',
          designation: 'Senior Consultant — Interventional Cardiology',
          languages: 'English, Hindi, Kannada',
          publicBio:
            'Dr. Jane Smith leads preventive and interventional cardiology services. Demo public profile for CMS preview.',
          areasOfInterest: 'Preventive cardiology, coronary intervention, heart failure management',
          isFeatured: true,
          displayOrder: 1,
          contentStatus: ContentStatus.PUBLISHED,
          departmentId: cardiology.id,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctor1Profile = doctorUser1.doctorProfile!;

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

  await prisma.blockedDate.create({
    data: {
      doctorId: doctor1Profile.id,
      startDate: new Date('2026-08-25'),
      endDate: new Date('2026-08-25'),
      reason: 'Attending Medical Conference',
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'dr.johnson@hospital.com',
      passwordHash: defaultPasswordHash,
      role: Role.DOCTOR,
      isActive: true,
      doctorProfile: {
        create: {
          fullName: 'Dr. Robert Johnson',
          slug: 'dr-robert-johnson',
          phoneNumber: '+91 98765 43211',
          qualification: 'MBBS, MS Orthopedics',
          experienceYears: 8,
          bio: 'Orthopedic Surgeon specializing in joint replacement and sports injury rehabilitation.',
          publicDisplayName: 'Dr. Robert Johnson',
          designation: 'Consultant — Orthopedic Surgery',
          languages: 'English, Hindi',
          publicBio:
            'Dr. Robert Johnson focuses on joint replacement and sports medicine. Demo public profile.',
          areasOfInterest: 'Knee and hip replacement, sports injuries, arthroscopy',
          isFeatured: true,
          displayOrder: 2,
          contentStatus: ContentStatus.PUBLISHED,
          departmentId: orthopedics.id,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctor2Profile = doctorUser2.doctorProfile!;

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

  await prisma.doctorSpeciality.createMany({
    data: [
      { doctorId: doctor1Profile.id, specialityId: specialityCardiology.id },
      { doctorId: doctor2Profile.id, specialityId: specialityOrthopedics.id },
    ],
  });

  await prisma.doctorCentre.createMany({
    data: [
      { doctorId: doctor1Profile.id, centreId: heartCentre.id },
      { doctorId: doctor2Profile.id, centreId: orthoCentre.id },
    ],
  });

  console.log('✅ Created 2 Doctor users with availability schedules.');

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

  // ─── Appointments ──────────────────────────────────────────────────────

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient1Profile.id,
        doctorId: doctor1Profile.id,
        appointmentDate: new Date('2026-08-09'),
        startTime: '09:00:00',
        endTime: '09:30:00',
        status: AppointmentStatus.BOOKED,
        reason: 'Routine annual cardiology health checkup.',
      },
      {
        patientId: patient2Profile.id,
        doctorId: doctor1Profile.id,
        appointmentDate: new Date('2026-08-15'),
        startTime: '09:30:00',
        endTime: '10:00:00',
        status: AppointmentStatus.CONFIRMED,
        reason: 'Chest discomfort evaluation.',
      },
      {
        patientId: patient1Profile.id,
        doctorId: doctor2Profile.id,
        appointmentDate: new Date('2026-08-10'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.COMPLETED,
        reason: 'Knee joint pain consultation.',
      },
      {
        patientId: patient2Profile.id,
        doctorId: doctor1Profile.id,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'Personal emergency.',
        cancelledBy: Role.PATIENT,
      },
    ],
  });

  console.log('✅ Created sample appointments across statuses (BOOKED, CONFIRMED, COMPLETED, CANCELLED).');

  // ─── CMS content ───────────────────────────────────────────────────────

  await prisma.healthArticle.createMany({
    data: [
      {
        title: 'Understanding Heart Health: A Demo Guide',
        slug: 'understanding-heart-health-demo',
        excerpt: 'Learn the basics of cardiovascular wellness — demo educational content.',
        content:
          'This is fictional demo content about heart health, seeded for the public health library. It is not medical advice.',
        author: 'CarePulse Editorial (Demo)',
        specialityId: specialityCardiology.id,
        tags: 'cardiology,heart-health,demo',
        publishedAt,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        title: 'Recovering After Joint Surgery (Demo)',
        slug: 'recovering-after-joint-surgery-demo',
        excerpt: 'Rehabilitation tips after orthopedic procedures — demo content only.',
        content: 'Demo article covering mobility exercises and follow-up care after joint surgery.',
        author: 'CarePulse Editorial (Demo)',
        specialityId: specialityOrthopedics.id,
        publishedAt,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.newsArticle.create({
    data: {
      title: 'CarePulse Opens New Cardiac Cath Lab (Demo News)',
      slug: 'new-cardiac-cath-lab-demo',
      excerpt: 'Fictional news item announcing expanded cardiac services.',
      content: 'This demo news article describes a fictional facility upgrade for development previews.',
      category: 'Hospital Updates',
      author: 'Communications Team (Demo)',
      publishedAt,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  await prisma.successStory.create({
    data: {
      title: 'Return to Active Life After Cardiac Care (Demo)',
      slug: 'cardiac-recovery-success-demo',
      summary: 'An anonymized demo success story highlighting cardiac rehabilitation.',
      content: 'This fictional patient journey is seeded for CMS demonstration purposes only.',
      patientDisplayName: 'Patient A (Demo)',
      ageGroup: '45–55',
      specialityId: specialityCardiology.id,
      doctorId: doctor1Profile.id,
      isAnonymizedDemo: true,
      publishedAt,
      contentStatus: ContentStatus.PUBLISHED,
    },
  });

  await prisma.testimonial.createMany({
    data: [
      {
        displayName: 'Priya S. (Demo)',
        text: 'The cardiology team was compassionate and thorough. Demo testimonial.',
        rating: 5,
        specialityId: specialityCardiology.id,
        isDemoContent: true,
        publishedAt,
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        displayName: 'Rahul K. (Demo)',
        text: 'Smooth joint replacement recovery with excellent physiotherapy support. Demo content.',
        rating: 5,
        specialityId: specialityOrthopedics.id,
        isDemoContent: true,
        publishedAt,
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        displayName: 'Meera D. (Demo)',
        text: 'Pediatric staff made our child feel safe and cared for. Demo testimonial.',
        rating: 4,
        specialityId: specialityPediatrics.id,
        isDemoContent: true,
        publishedAt,
        displayOrder: 3,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.faqItem.createMany({
    data: [
      {
        question: 'How do I book an appointment online?',
        answer: 'Use the Book Appointment page, select a doctor, date, and available time slot.',
        category: 'Appointments',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        question: 'What are the hospital visiting hours?',
        answer: 'General wards: 4–7 PM daily. ICU visiting is restricted — please check with nursing staff.',
        category: 'Visiting',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        question: 'Do you accept health insurance?',
        answer:
          'We maintain informational partnerships with insurers. Cashless claims processing is not available in this demo system.',
        category: 'Billing',
        displayOrder: 3,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        question: 'Is emergency care available 24×7?',
        answer: 'Yes. Our emergency desk is staffed around the clock.',
        category: 'Emergency',
        displayOrder: 4,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        question: 'Can international patients request treatment?',
        answer: 'Yes. Submit an enquiry via the International Patients page for coordinator follow-up.',
        category: 'International',
        displayOrder: 5,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.patientResource.createMany({
    data: [
      {
        title: 'Pre-Visit Checklist (Demo PDF)',
        slug: 'pre-visit-checklist-demo',
        description: 'What to bring for your first outpatient appointment.',
        category: 'Guides',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        title: 'Discharge Instructions Template (Demo)',
        slug: 'discharge-instructions-demo',
        description: 'Sample post-discharge care instructions for demo purposes.',
        category: 'Guides',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.insurancePartner.createMany({
    data: [
      {
        name: 'Demo Health Insure Co.',
        slug: 'demo-health-insure',
        description:
          'Informational partner listing only — not for cashless claim submission in this demo.',
        displayOrder: 1,
        contentStatus: ContentStatus.PUBLISHED,
      },
      {
        name: 'Sample MediCover (Demo)',
        slug: 'sample-medicover-demo',
        description:
          'Fictional insurer shown for UI preview. Does not imply empanelment or cashless approval.',
        displayOrder: 2,
        contentStatus: ContentStatus.PUBLISHED,
      },
    ],
  });

  await prisma.internationalPageContent.create({
    data: {
      title: 'International Patients — CarePulse Hospital (Demo)',
      introduction:
        'Welcome international guests. This page contains demo content for coordinator workflows.',
      howToRequest: 'Complete the international patient enquiry form with your treatment interest.',
      secondOpinion: 'Upload prior reports for a remote second-opinion review by our specialists.',
      requiredDocuments: 'Passport copy, medical records, physician referral (if available).',
      travelInformation: 'Bengaluru is served by Kempegowda International Airport (BLR).',
      accommodationInfo: 'Nearby hotels and serviced apartments are listed on request.',
      coordinatorContact: 'intl@carepulse.hospital · +91 80 4567 8901 (demo line)',
    },
  });

  const homepageSections: HomepageSectionType[] = [
    HomepageSectionType.HERO,
    HomepageSectionType.ABOUT,
    HomepageSectionType.FEATURED_DEPARTMENTS,
    HomepageSectionType.CENTRES_OF_EXCELLENCE,
    HomepageSectionType.FEATURED_DOCTORS,
    HomepageSectionType.SPECIALITIES,
    HomepageSectionType.SERVICES,
    HomepageSectionType.HEALTH_PACKAGES,
    HomepageSectionType.TESTIMONIALS,
    HomepageSectionType.SUCCESS_STORIES,
    HomepageSectionType.NEWS,
    HomepageSectionType.HEALTH_LIBRARY,
    HomepageSectionType.TRUST,
    HomepageSectionType.CONTACT_CTA,
  ];

  await prisma.homepageSection.createMany({
    data: homepageSections.map((sectionType, index) => ({
      sectionType,
      title: sectionType.replace(/_/g, ' '),
      isEnabled: true,
      displayOrder: index + 1,
    })),
  });

  console.log('✅ Seeded demo CMS content (hospital profile, specialities, articles, FAQs, etc.).');
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
