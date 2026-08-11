import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { publicPageMetadata } from '@/lib/seo';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = publicPageMetadata({
  title: `Privacy · ${APP_CONFIG.appName}`,
  description: `Privacy notice for ${APP_CONFIG.appName} outpatient appointment services.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy notice"
        subtitle="How CarePulse Hospital handles personal information submitted through this demo outpatient platform."
      />
      <section className="section-pad">
        <div className="container-page prose-hospital max-w-3xl">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]}
            className="mb-8"
          />
          <div className="space-y-5 text-sm leading-relaxed text-ink-muted">
            <p>
              {APP_CONFIG.appName} collects account, contact, and appointment information solely to
              provide outpatient scheduling and related hospital communications.
            </p>
            <p>
              Passwords are stored only as irreversible hashes. Appointment and profile data is
              accessible to authorized hospital roles (patient, treating doctor, and administrators)
              according to role-based access controls.
            </p>
            <p>
              This deployment may use fictional demo content. Do not submit real clinical records or
              sensitive personal health information beyond what is required for scheduling demos.
            </p>
            <p>
              Questions about privacy practices: {' '}
              <a href={`mailto:${APP_CONFIG.contact.email}`} className="font-semibold text-brand-700">
                {APP_CONFIG.contact.email}
              </a>
              {' '}or visit our{' '}
              <Link href="/contact" className="font-semibold text-brand-700">
                contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
