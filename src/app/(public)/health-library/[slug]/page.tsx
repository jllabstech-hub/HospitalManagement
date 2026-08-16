import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getArticleBySlug } from '@/features/cms/queries/content';
import CmsRecordImage from '@/components/cms/CmsRecordImage';
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
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article not found' };
  return {
    title: article.seoTitle ?? `${article.title} · Health Library · ${APP_CONFIG.appName}`,
    description: article.seoDescription ?? article.excerpt ?? article.title,
  };
}

export default async function HealthLibraryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <PageHero
        eyebrow="Health library"
        title={article.title}
        subtitle={article.excerpt ?? undefined}
      />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Health Library', href: '/health-library' },
              { label: article.title },
            ]}
            className="mb-8"
          />

          <CmsRecordImage
            src={article.coverImageUrl}
            fallbackTitle={article.title}
            alt={article.title}
            className="mb-8 rounded-card border border-[#dde5e9]"
          />

          <p className="mb-6 rounded-button bg-amber-50 px-4 py-3 text-xs text-amber-800">
            For general education only — not medical advice. Consult a qualified clinician for
            personal health decisions.
          </p>

          <div className="card-surface p-6 sm:p-8">
            {article.author && (
              <p className="mb-4 text-sm text-ink-muted">
                {article.author}
                {article.publishedAt &&
                  ` · ${new Date(article.publishedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`}
              </p>
            )}
            <div className="prose prose-sm max-w-none text-ink-muted whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {article.speciality && (
            <div className="mt-6">
              <Link
                href={`/specialities/${article.speciality.slug}`}
                className="text-sm font-semibold text-brand-700"
              >
                Related speciality: {article.speciality.name} →
              </Link>
            </div>
          )}

          <div className="mt-8">
            <Link href="/health-library" className="btn-secondary">
              ← All articles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
