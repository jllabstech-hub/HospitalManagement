import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import CmsRecordImage from '@/components/cms/CmsRecordImage';
import { getPublishedNews } from '@/features/cms/queries/content';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `News · ${APP_CONFIG.appName}`,
  description: `Hospital news and updates from ${APP_CONFIG.appName}.`,
};

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const search = params.search?.trim() ?? '';

  const result = await getPublishedNews({ search: search || undefined, page, limit: 12 });

  const buildPageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (p > 1) qs.set('page', String(p));
    const q = qs.toString();
    return q ? `/news?${q}` : '/news';
  };

  return (
    <>
      <PageHero
        eyebrow="Updates"
        title="Hospital news"
        subtitle="Announcements, community updates, and hospital programme news."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'News' }]}
            className="mb-8"
          />

          <form method="get" className="card-surface mb-8 flex flex-col gap-3 p-4 sm:flex-row">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search news"
              className="flex-1 rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          {result.news.length === 0 ? (
            <EmptyState
              title="No news published yet"
              description="Hospital news and announcements will appear here once published."
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.news.map((item) => (
                  <Card key={item.id} hover padding="none" className="flex h-full flex-col overflow-hidden">
                    <CmsRecordImage src={item.coverImageUrl} fallbackTitle={item.title} alt={item.title} className="rounded-t-card" />
                    <div className="flex h-full flex-col p-6">
                    {item.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                        {item.category}
                      </span>
                    )}
                    <h2 className="mt-2 text-lg font-semibold text-ink">{item.title}</h2>
                    {item.excerpt && (
                      <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">{item.excerpt}</p>
                    )}
                    <Link
                      href={`/news/${item.slug}`}
                      className="mt-4 text-sm font-semibold text-brand-700"
                    >
                      Read more →
                    </Link>
                    </div>
                  </Card>
                ))}
              </div>

              {result.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  {page > 1 && (
                    <Link href={buildPageHref(page - 1)} className="btn-secondary">
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-ink-muted">
                    Page {result.currentPage} of {result.totalPages}
                  </span>
                  {page < result.totalPages && (
                    <Link href={buildPageHref(page + 1)} className="btn-secondary">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
