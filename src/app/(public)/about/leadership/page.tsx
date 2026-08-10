import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedLeadership } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Leadership · ${APP_CONFIG.appName}`,
  description: `Meet the leadership team guiding ${APP_CONFIG.appName}.`,
};

export default async function LeadershipPage() {
  const leaders = await getPublishedLeadership();

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Hospital leadership"
        subtitle="Experienced clinicians and administrators committed to safe, coordinated outpatient care."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Leadership' },
            ]}
            className="mb-8"
          />

          {leaders.length === 0 ? (
            <EmptyState
              title="Leadership profiles coming soon"
              description="Hospital leadership information will appear here once published in the CMS."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((leader) => (
                <Card key={leader.id} hover className="flex h-full flex-col">
                  <h2 className="text-lg font-semibold text-ink">{leader.name}</h2>
                  <p className="text-sm font-medium text-brand-700">{leader.designation}</p>
                  {leader.shortBio && (
                    <p className="mt-3 flex-1 text-sm text-ink-muted line-clamp-4">{leader.shortBio}</p>
                  )}
                  <Link
                    href={`/about/leadership/${leader.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    View profile →
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
