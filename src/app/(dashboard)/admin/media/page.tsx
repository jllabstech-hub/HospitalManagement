import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function AdminMediaLibraryPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const search = params.search?.trim() || '';

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: search
      ? {
          OR: [
            { url: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
            { caption: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Media Asset Library</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Upload, inspect, search, and manage authoritative hospital media assets.
          </p>
        </div>
        <Link href="/admin/content" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Content
        </Link>
      </div>

      {/* Upload Component Container */}
      <div className="card-surface p-5 sm:p-6">
        <h2 className="font-bold text-ink mb-2">Upload New Media Asset</h2>
        <ImageUploadPicker
          label="Select File"
          description="Upload JPG, PNG, WebP, or SVG assets up to 5MB."
          value=""
          onChange={() => {}}
        />
      </div>

      {/* Search Filter Bar */}
      <div className="card-surface p-4">
        <form method="GET" action="/admin/media" className="flex items-center gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search media by filename, alt text, or caption..."
            className="w-full rounded-button border border-[#dde5e9] px-3.5 py-2 text-xs font-medium focus:border-brand-600 focus:outline-none"
          />
          <button type="submit" className="btn-primary !py-2 !text-xs shrink-0">
            Search Assets
          </button>
          {search && (
            <Link href="/admin/media" className="btn-secondary !py-2 !text-xs shrink-0">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Media Grid */}
      <div className="card-surface p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[#dde5e9] pb-3 mb-4">
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            Total Assets ({mediaAssets.length})
          </span>
        </div>

        {mediaAssets.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            No media assets found in library.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex flex-col overflow-hidden rounded-card border border-[#dde5e9] bg-white p-2 shadow-soft transition hover:border-brand-300 hover:shadow-card"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-button bg-surface-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.altText || 'Media Asset'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2 space-y-1 text-[11px]">
                  <p className="font-bold text-ink truncate" title={asset.url}>
                    {asset.url.split('/').pop()}
                  </p>
                  <p className="text-ink-muted truncate">{asset.altText}</p>
                  <div className="flex items-center gap-1">
                    <span className="inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-800">
                      {asset.mimeType || asset.type}
                    </span>
                    {asset.fileSize && (
                      <span className="inline-block rounded bg-surface-soft px-1.5 py-0.5 text-[9px] font-semibold text-ink-muted">
                        {(asset.fileSize / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                <form action={async () => {
                  'use server';
                  const { requireAdmin } = await import('@/server/security/auth-helpers');
                  const { prisma } = await import('@/server/db/client');
                  await requireAdmin();
                  await prisma.mediaAsset.delete({ where: { id: asset.id } });
                  const { revalidatePath } = await import('next/cache');
                  revalidatePath('/admin/media');
                }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button type="submit" className="rounded-full bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-200 shadow-sm" title="Delete Asset">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
