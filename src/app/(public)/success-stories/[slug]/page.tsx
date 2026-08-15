import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import {
  getSuccessStoryBySlug,
} from '@/features/cms/queries/content';
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
  const story = await getSuccessStoryBySlug(slug);
  if (!story) return { title: 'Story not found' };
  return {
    title: story.seoTitle ?? `${story.title} · Success Stories · ${APP_CONFIG.appName}`,
    description: story.seoDescription ?? story.summary ?? story.title,
  };
}

export default async function SuccessStoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getSuccessStoryBySlug(slug);
  if (!story) notFound();

  return (
    <>
      <PageHero eyebrow="Success story" title={story.title} subtitle={story.summary ?? undefined} />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Success Stories', href: '/success-stories' },
              { label: story.title },
            ]}
            className="mb-8"
          />

          {story.isAnonymizedDemo && (
            <p className="mb-6 rounded-button bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Demo content — this anonymized story is illustrative and not a verified medical
              outcome or endorsement.
            </p>
          )}

          <div className="card-surface p-6 sm:p-8">
            {story.patientDisplayName && (
              <p className="mb-4 text-sm font-medium text-ink">{story.patientDisplayName}</p>
            )}
            <div className="prose prose-sm max-w-none text-ink-muted whitespace-pre-line">
              {story.content}
            </div>
          </div>

          {story.doctor && (
            <div className="mt-6 card-surface p-4">
              <p className="text-sm text-ink-muted">
                Care team:{' '}
                <Link
                  href={`/doctors/${story.doctor.slug ?? story.doctor.id}`}
                  className="font-semibold text-brand-700"
                >
                  {story.doctor.fullName}
                </Link>
                {story.doctor.designation && ` · ${story.doctor.designation}`}
              </p>
            </div>
          )}

          <div className="mt-8">
            <Link href="/success-stories" className="btn-secondary">
              ← All stories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
