import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { publicPageMetadata } from '@/lib/seo';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = publicPageMetadata({
  title: `Terms of use · ${APP_CONFIG.appName}`,
  description: `Terms of use for the ${APP_CONFIG.appName} outpatient appointment platform.`,
  path: '/terms',
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        subtitle="Conditions for using the CarePulse Hospital outpatient booking and information website."
      />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Terms' }]}
            className="mb-8"
          />
          <div className="space-y-5 text-sm leading-relaxed text-ink-muted">
            <p>
              By using this website and patient portal you agree to provide accurate registration
              details, use the booking system only for legitimate outpatient consultations, and
              respect hospital scheduling policies.
            </p>
            <p>
              Online booking confirms a requested 30-minute consultation slot subject to hospital
              confirmation workflows. Emergency medical care must not rely on this online system —
              use local emergency services.
            </p>
            <p>
              Content marked as demo or fictional is for product demonstration only and does not
              constitute medical advice.
            </p>
            <p>
              For assistance, see{' '}
              <Link href="/patient-resources" className="font-semibold text-brand-700">
                patient resources
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="font-semibold text-brand-700">
                contact the hospital desk
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
