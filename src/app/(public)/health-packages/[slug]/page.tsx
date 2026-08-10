import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import PackageInfoRequestForm from '@/features/cms/components/PackageInfoRequestForm';
import { getPackageBySlug, getPublishedPackages } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const packages = await getPublishedPackages();
  return packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: 'Package not found' };
  return {
    title: pkg.seoTitle ?? `${pkg.name} · Health Packages · ${APP_CONFIG.appName}`,
    description: pkg.seoDescription ?? pkg.description ?? pkg.name,
  };
}

function formatPrice(price: number | { toNumber?: () => number } | null, currency: string | null) {
  if (price == null) return null;
  const numPrice = typeof price === 'number' ? price : Number(price);
  const cur = currency ?? 'INR';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur }).format(numPrice);
}

export default async function HealthPackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  return (
    <>
      <PageHero eyebrow="Health package" title={pkg.name} subtitle={pkg.description ?? undefined} />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Health Packages', href: '/health-packages' },
              { label: pkg.name },
            ]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-surface p-6 sm:p-8">
                {formatPrice(pkg.price, pkg.currency) && (
                  <p className="text-2xl font-semibold text-brand-800">
                    {formatPrice(pkg.price, pkg.currency)}
                  </p>
                )}
                {pkg.isDemoPricing && (
                  <p className="mt-2 rounded-button bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Demo pricing — illustrative sample only. Final rates confirmed at booking.
                  </p>
                )}
                {pkg.duration && (
                  <p className="mt-3 text-sm text-ink-muted">Typical duration: {pkg.duration}</p>
                )}
                {pkg.detailedDescription && (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                    {pkg.detailedDescription}
                  </p>
                )}
                {pkg.includedItems && (
                  <div className="mt-6">
                    <h2 className="font-semibold text-ink">Included</h2>
                    <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">{pkg.includedItems}</p>
                  </div>
                )}
                {pkg.eligibility && (
                  <div className="mt-6">
                    <h2 className="font-semibold text-ink">Eligibility</h2>
                    <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">{pkg.eligibility}</p>
                  </div>
                )}
                {pkg.preparationInstructions && (
                  <div className="mt-6">
                    <h2 className="font-semibold text-ink">Preparation</h2>
                    <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                      {pkg.preparationInstructions}
                    </p>
                  </div>
                )}
              </div>
              <Link href="/health-packages" className="btn-secondary">
                ← All packages
              </Link>
            </div>

            <aside>
              <h2 className="font-display text-lg font-semibold text-ink">Request information</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Share your details and our health check team will follow up with package information.
              </p>
              <div className="mt-4">
                <PackageInfoRequestForm packageSlug={pkg.slug} packageName={pkg.name} />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
