import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getLeadershipBySlug } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Host-based multi-tenancy: slugs are resolved at request time.
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const leader = await getLeadershipBySlug(slug);
  if (!leader) return { title: 'Leader not found' };
  return {
    title: `${leader.name} · Leadership · ${APP_CONFIG.appName}`,
    description: leader.shortBio ?? `${leader.designation} at ${APP_CONFIG.appName}`,
  };
}

export default async function LeadershipDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const leader = await getLeadershipBySlug(slug);
  if (!leader) notFound();

  return (
    <>
      <PageHero eyebrow="Leadership" title={leader.name} subtitle={leader.designation ?? undefined} />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Leadership', href: '/about/leadership' },
              { label: leader.name },
            ]}
            className="mb-8"
          />
          <div className="card-surface p-6 sm:p-8">
            {leader.fullBio ? (
              <div className="prose prose-sm max-w-none text-ink-muted whitespace-pre-line">
                {leader.fullBio}
              </div>
            ) : leader.shortBio ? (
              <p className="text-sm leading-relaxed text-ink-muted">{leader.shortBio}</p>
            ) : (
              <p className="text-sm text-ink-muted">
                Profile details will be updated soon. This is a demo leadership listing.
              </p>
            )}
          </div>
          <div className="mt-6">
            <Link href="/about/leadership" className="btn-secondary">
              ← Back to leadership
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
