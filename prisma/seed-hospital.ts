import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.hospitalProfile.findFirst();

  const data = {
    hospitalName: 'CarePulse Super Speciality Hospital',
    legalName: 'CarePulse Healthcare Private Limited',
    tagline: 'Advanced Patient-First Healthcare & Surgical Excellence',
    shortDescription:
      'CarePulse Super Speciality Hospital is Bengaluru’s premier NABH-accredited multi-speciality tertiary care medical institute, delivering world-class compassionate care 24/7.',
    fullDescription:
      'CarePulse Super Speciality Hospital stands at the forefront of modern medical innovation in Bengaluru. Spanning over 250,000 sq. ft. of state-of-the-art infrastructure, our institute features 350+ inpatient beds, 14 ultra-modern modular operation theatres, a 24x7 Level-1 Emergency & Trauma Centre, advanced Cardiac Cath Labs, and a Level-3 NICU. With 150+ internationally trained senior consultants across 30+ specialities, we combine cutting-edge robotic surgery, precision diagnostics, and personalized patient care to ensure optimum clinical outcomes.',
    phone: '+91 80 4567 8900',
    emergencyPhone: '+91 80 4567 8999',
    email: 'contact@carepulsehospital.com',
    addressLine1: '124 CarePulse Avenue, Outer Ring Road',
    addressLine2: 'Near Tech Park Signal, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    country: 'India',
    timezone: 'Asia/Kolkata',
    websiteUrl:
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:5000',
    workingHours: 'OPD: Mon – Sat: 8:00 AM – 8:00 PM | Emergency & Trauma Care: 24 Hours / 7 Days',
    mission:
      'To deliver patient-centered, compassionate, and affordable healthcare of international standards through clinical excellence, advanced medical technology, and ethical practices.',
    vision:
      'To be South Asia’s most trusted super-speciality medical institution, recognized globally for groundbreaking clinical outcomes, robotic surgical innovation, and medical research.',
    values:
      'Compassion, Clinical Integrity, Innovation, Patient Safety, Transparency, & Excellence.',
    heroImageUrl:
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1600',
    logoUrl:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    customDomain:
      process.env.DEFAULT_HOSPITAL_CUSTOM_DOMAIN?.trim() ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, '') ||
      'hospital-management-jllabs.vercel.app',
    subdomain: process.env.DEFAULT_TENANT_DOMAIN?.trim() || 'carepulse',
    primaryColor: '#0ea5e9',
    secondaryColor: '#f43f5e',
    fontFamily: 'Inter, sans-serif',
    facebookUrl: 'https://facebook.com/carepulsehospital',
    twitterUrl: 'https://twitter.com/carepulsehosp',
    instagramUrl: 'https://instagram.com/carepulsehospital',
    linkedinUrl: 'https://linkedin.com/company/carepulsehospital',
    isActive: true,
  };

  if (existing) {
    await prisma.hospitalProfile.update({
      where: { id: existing.id },
      data,
    });
    console.log('Successfully prefilled active hospital profile details!');
  } else {
    await prisma.hospitalProfile.create({
      data,
    });
    console.log('Successfully created prefilled hospital profile!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
