import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import MediaUploadWrapper from './MediaUploadWrapper';
import DeleteMediaButton from './DeleteMediaButton';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface PageProps {
  searchParams?: Promise<{
    search?: string;
  }>;
}

export default async function AdminMediaLibraryPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const search = typeof params.search === 'string' ? params.search.trim() : '';

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
      <AdminPageHeader
        title="Media Asset Library"
        description="Upload, inspect, search, and manage authoritative hospital media assets."
        frontendPath="/"
      >
        <Link href="/admin/content" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Content
        </Link>
      </AdminPageHeader>

      {/* Upload Component Container */}
      <div className="card-surface p-5 sm:p-6">
        <h2 className="font-bold text-ink mb-2">Upload New Media Asset</h2>
        <MediaUploadWrapper />
      </div>

      {/* Search Filter Bar */}
      <div className="card-surface p-4">
        <InteractiveSearchInput
          defaultValue={search}
          placeholder="Search media by filename, alt text, or caption..."
          className="w-full"
        />
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
                    className="h-full w-full max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-2 space-y-1 text-[11px]">
                  <p className="font-bold text-ink truncate" title={asset.altText || (asset.url.startsWith('data:') ? 'Uploaded Asset' : asset.url)}>
                    {asset.altText || (asset.url.startsWith('data:') ? 'Uploaded Asset' : asset.url.split('/').pop())}
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
                <DeleteMediaButton id={asset.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
