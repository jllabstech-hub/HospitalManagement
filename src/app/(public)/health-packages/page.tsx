import type { Metadata } from 'next';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import HealthPackageFilter from '@/components/public/HealthPackageFilter';
import { getPublishedPackages } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Health Check Packages · ${APP_CONFIG.appName}`,
  description: `Preventive health check packages, master health checkups, executive cardiac screening, and senior citizen health plans at ${APP_CONFIG.appName}.`,
};

export default async function HealthPackagesPage() {
  const packages = await getPublishedPackages();

  return (
    <>
      <PageHero
        eyebrow="Preventive Healthcare & Diagnostics"
        title="Comprehensive Health Check Packages"
        subtitle="Structured screening programmes and early detection packages designed for all age groups and health needs."
      />
      <section className="section-pad bg-gradient-to-b from-white via-surface-soft/40 to-white">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Health Packages' }]}
            className="mb-8"
          />

          {packages.length === 0 ? (
            <EmptyState
              title="No health packages published yet"
              description="Preventive health packages will appear here once published."
              actionHref="/contact"
              actionLabel="Contact us"
            />
          ) : (
            <HealthPackageFilter packages={packages} />
          )}
        </div>
      </section>
    </>
  );
}
