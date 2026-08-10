import type { Metadata } from 'next';
import Link from 'next/link';
import BrandLogo from '@/components/layout/BrandLogo';
import RegisterForm from '@/features/auth/components/RegisterForm';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: 'Patient Registration',
  description: `Create a patient account at ${APP_CONFIG.appName} to book 30-minute outpatient consultations.`,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-warm">
      <div className="absolute inset-0 hero-mesh opacity-[0.12]" aria-hidden />
      <div className="absolute inset-0 pattern-dots opacity-40" aria-hidden />

      <div className="relative flex min-h-screen flex-col">
        <div className="container-page flex h-16 items-center justify-between">
          <BrandLogo />
          <Link href="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            Sign In
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
