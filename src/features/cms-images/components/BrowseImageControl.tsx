'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';
import { attachStockImageAction } from '../actions';
import { CMS_STOCK_IMAGES, searchStockImages } from '../stock-catalog';
import type { CmsImageContentType } from '../types';

interface BrowseImageControlProps {
  contentType: CmsImageContentType;
  recordId: string;
  title: string;
  currentImageUrl?: string | null;
  compact?: boolean;
  onAttached?: (url: string) => void;
}

export default function BrowseImageControl({
  contentType,
  recordId,
  title,
  currentImageUrl,
  compact = false,
  onAttached,
}: BrowseImageControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const images = useMemo(() => {
    const matches = searchStockImages(query, 24);
    return matches.length > 0 ? matches : CMS_STOCK_IMAGES.slice(0, 12);
  }, [query]);

  const attach = async (url: string) => {
    if (!url || saving) return;
    setSaving(true);
    setError(null);
    const result = await attachStockImageAction({ contentType, recordId, url });
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Unable to attach image.');
      return;
    }
    onAttached?.(result.data?.url || url);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        className={
          compact
            ? 'text-sm font-medium text-brand-700 hover:underline disabled:opacity-50'
            : 'rounded-button border border-[#dde5e9] bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-50'
        }
        disabled={saving}
        onClick={() => {
          setQuery(title);
          setError(null);
          setOpen(true);
        }}
      >
        Browse
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Browse images for ${title}`}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-[#dde5e9] bg-white shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-[#dde5e9] px-5 py-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Browse images</h3>
                <p className="text-xs text-ink-muted">
                  Upload, choose from the media library, or pick a relevant medical photo for {title}.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-muted">
                ✕
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              <ImageUploadPicker
                variant="default"
                label="Upload or library"
                description="Upload a new photo or browse files already in the media library."
                value={currentImageUrl}
                onChange={(url) => void attach(url)}
              />
              <div>
                <label className="mb-2 block text-xs font-semibold text-ink">Relevant medical photos</label>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cardiology, surgery, paediatrics..."
                  className="mb-3 w-full rounded-xl border border-[#d2d6dc] px-3.5 py-2 text-sm focus:border-brand-700 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      disabled={saving}
                      onClick={() => void attach(image.url)}
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        currentImageUrl === image.url
                          ? 'border-brand-700 ring-2 ring-brand-700/20'
                          : 'border-[#dde5e9] hover:border-brand-700'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.alt} className="aspect-video w-full object-cover" />
                      <span className="block px-2 py-1.5 text-[11px] font-medium text-ink">{image.alt}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="text-sm font-medium text-rose-700" role="alert">
                  {error}
                </p>
              ) : null}
              {saving ? <p className="text-xs text-ink-muted">Saving image to this speciality...</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
