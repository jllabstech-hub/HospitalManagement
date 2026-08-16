import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';
import HospitalProfileForm from '@/features/cms/components/HospitalProfileForm';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminHospitalProfilePage() {
  await requireAdmin();
  const profile = await getActiveHospitalProfile();

  const formData = {
    id: profile?.id,
    hospitalName: profile?.hospitalName || 'CarePulse Super Speciality Hospital',
    tagline: profile?.tagline || 'Advanced Patient-First Healthcare & Surgical Excellence',
    shortDescription:
      profile?.shortDescription ||
      'CarePulse Super Speciality Hospital is Bengaluru’s premier NABH-accredited multi-speciality tertiary care medical institute, delivering world-class compassionate care 24/7.',
    fullDescription:
      profile?.fullDescription ||
      'CarePulse Super Speciality Hospital stands at the forefront of modern medical innovation in Bengaluru. Spanning over 250,000 sq. ft. of state-of-the-art infrastructure, our institute features 350+ inpatient beds, 14 ultra-modern modular operation theatres, a 24x7 Level-1 Emergency & Trauma Centre, advanced Cardiac Cath Labs, and a Level-3 NICU. With 150+ internationally trained senior consultants across 30+ specialities, we combine cutting-edge robotic surgery, precision diagnostics, and personalized patient care to ensure optimum clinical outcomes.',
    country: profile?.country || 'India',
    timezone: profile?.timezone || 'Asia/Kolkata',
    websiteUrl: profile?.websiteUrl || 'http://localhost:5000',
    mission:
      profile?.mission ||
      'To deliver patient-centered, compassionate, and affordable healthcare of international standards through clinical excellence, advanced medical technology, and ethical practices.',
    vision:
      profile?.vision ||
      'To be South Asia’s most trusted super-speciality medical institution, recognized globally for groundbreaking clinical outcomes, robotic surgical innovation, and medical research.',
    values:
      profile?.values ||
      'Compassion, Clinical Integrity, Innovation, Patient Safety, Transparency, & Excellence.',
    heroImageUrl:
      profile?.heroImageUrl ||
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1600',
    logoUrl:
      profile?.logoUrl ||
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    customDomain: profile?.customDomain || 'hospital-management-jllabs.vercel.app',
    subdomain: profile?.subdomain || 'carepulse',
    primaryColor: profile?.primaryColor || '#0ea5e9',
    secondaryColor: profile?.secondaryColor || '#f43f5e',
    fontFamily: profile?.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hospital Profile & Branding"
        description="Edit hospital name, about text, mission, logo, and brand colors. Footer contact details are on Website Footer."
        frontendPath="/about/overview"
      >
        <Link href="/admin/content/footer" className="text-sm font-semibold text-brand-700 hover:underline">
          Edit footer →
        </Link>
        <Link href="/admin/content" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Content
        </Link>
      </AdminPageHeader>

      <HospitalProfileForm profile={formData} />
    </div>
  );
}
