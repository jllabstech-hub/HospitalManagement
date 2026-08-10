import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedInsurancePartners } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Insurance & TPA · ${APP_CONFIG.appName}`,
  description: `Insurance partners and cashless facility information at ${APP_CONFIG.appName}.`,
};

export default async function InsurancePage() {
  const partners = await getPublishedInsurancePartners();

  return (
    <>
      <PageHero
        eyebrow="Billing support"
        title="Insurance & TPA partners"
        subtitle="Cashless and reimbursement support for eligible outpatient visits. Partner listings are indicative—verify coverage before your visit."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Insurance' }]}
            className="mb-8"
          />

          <p className="mb-8 rounded-button bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Demo partner listings may be used for illustration. Confirm active empanelment and
            policy terms with our billing desk before treatment.
          </p>

          {partners.length === 0 ? (
            <EmptyState
              title="No insurance partners published yet"
              description="Empanelled insurers and TPAs will appear here once added to the CMS."
              actionHref="/contact"
              actionLabel="Contact billing desk"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => (
                <Card key={partner.id} className="flex h-full flex-col">
                  <h2 className="text-lg font-semibold text-ink">{partner.name}</h2>
                  {partner.description && (
                    <p className="mt-2 flex-1 text-sm text-ink-muted">{partner.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Link href="/contact" className="btn-primary">
              Ask about coverage
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
