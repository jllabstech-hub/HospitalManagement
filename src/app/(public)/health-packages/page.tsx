import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedPackages } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Health Packages · ${APP_CONFIG.appName}`,
  description: `Preventive health check packages at ${APP_CONFIG.appName}. Demo pricing where indicated.`,
};

function formatPrice(price: number | { toNumber?: () => number } | null, currency: string | null) {
  if (price == null) return null;
  const numPrice = typeof price === 'number' ? price : Number(price);
  const cur = currency ?? 'INR';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur }).format(numPrice);
}

export default async function HealthPackagesPage() {
  const packages = await getPublishedPackages();

  return (
    <>
      <PageHero
        eyebrow="Preventive care"
        title="Health check packages"
        subtitle="Structured screening programmes. Packages marked as demo pricing are illustrative samples—not live billing rates."
      />
      <section className="section-pad">
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} hover className="flex h-full flex-col">
                  <h2 className="text-lg font-semibold text-ink">{pkg.name}</h2>
                  {pkg.description && (
                    <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">{pkg.description}</p>
                  )}
                  <div className="mt-4 space-y-1">
                    {formatPrice(pkg.price, pkg.currency) && (
                      <p className="text-lg font-semibold text-brand-800">
                        {formatPrice(pkg.price, pkg.currency)}
                      </p>
                    )}
                    {pkg.isDemoPricing && (
                      <p className="text-xs font-medium text-amber-700">
                        Demo pricing — for illustration only
                      </p>
                    )}
                    {pkg.duration && (
                      <p className="text-xs text-ink-muted">Duration: {pkg.duration}</p>
                    )}
                  </div>
                  <Link
                    href={`/health-packages/${pkg.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    View package →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
