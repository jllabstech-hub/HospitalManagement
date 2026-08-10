import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedSuccessStories } from '@/features/cms/queries/content';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Success Stories · ${APP_CONFIG.appName}`,
  description: `Patient recovery stories and care journeys at ${APP_CONFIG.appName}. Demo-labelled entries are illustrative.`,
};

export default async function SuccessStoriesPage() {
  const stories = await getPublishedSuccessStories();

  return (
    <>
      <PageHero
        eyebrow="Care journeys"
        title="Success stories"
        subtitle="Illustrative recovery narratives for patient education. Anonymized demo stories are clearly labelled—not verified medical outcomes."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Success Stories' }]}
            className="mb-8"
          />

          {stories.length === 0 ? (
            <EmptyState
              title="No success stories published yet"
              description="Patient journey stories will appear here once published."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <Card key={story.id} hover className="flex h-full flex-col">
                  {story.isAnonymizedDemo && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Demo content
                    </span>
                  )}
                  <h2 className="mt-2 text-lg font-semibold text-ink">{story.title}</h2>
                  {story.summary && (
                    <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">{story.summary}</p>
                  )}
                  {story.patientDisplayName && (
                    <p className="mt-3 text-xs text-ink-muted">{story.patientDisplayName}</p>
                  )}
                  <Link
                    href={`/success-stories/${story.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    Read story →
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
