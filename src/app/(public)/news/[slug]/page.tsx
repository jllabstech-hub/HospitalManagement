import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getNewsBySlug } from '@/features/cms/queries/content';
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
  const item = await getNewsBySlug(slug);
  if (!item) return { title: 'News not found' };
  return {
    title: item.seoTitle ?? `${item.title} · News · ${APP_CONFIG.appName}`,
    description: item.seoDescription ?? item.excerpt ?? item.title,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  return (
    <>
      <PageHero eyebrow={item.category ?? 'News'} title={item.title} subtitle={item.excerpt ?? undefined} />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'News', href: '/news' },
              { label: item.title },
            ]}
            className="mb-8"
          />

          <div className="card-surface p-6 sm:p-8">
            {(item.author || item.publishedAt) && (
              <p className="mb-4 text-sm text-ink-muted">
                {[item.author, item.publishedAt && new Date(item.publishedAt).toLocaleDateString('en-IN')]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <div className="prose prose-sm max-w-none text-ink-muted whitespace-pre-line">
              {item.content}
            </div>
          </div>

          <div className="mt-8">
            <Link href="/news" className="btn-secondary">
              ← All news
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
