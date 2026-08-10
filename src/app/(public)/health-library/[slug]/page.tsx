import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getArticleBySlug, getPublishedArticles } from '@/features/cms/queries/content';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { articles } = await getPublishedArticles({ limit: 100 });
  return articles.map((a) => ({ slug: a.slug }));
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
