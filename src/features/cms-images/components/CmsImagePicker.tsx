'use client';

import { useMemo, useState } from 'react';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';
import { CMS_STOCK_IMAGES, searchStockImages } from '../stock-catalog';
import type { CmsImageContentType } from '../types';
import GenerateImageControl from './GenerateImageControl';

interface CmsImagePickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  title?: string;
  contentType?: CmsImageContentType;
  recordId?: string | null;
}

export default function CmsImagePicker({
  value,
  onChange,
  label = 'Cover image',
  description = 'Upload a photo, browse the media library, or pick a relevant medical image. This image appears on the public website.',
  title,
  contentType,
  recordId,
}: CmsImagePickerProps) {
  const [stockOpen, setStockOpen] = useState(false);
  const [query, setQuery] = useState(title || '');

  const images = useMemo(() => {
    const matches = searchStockImages(query, 24);
    return matches.length > 0 ? matches : CMS_STOCK_IMAGES.slice(0, 12);
  }, [query]);

  return (
    <div className="space-y-3">
      <ImageUploadPicker
        variant="default"
        label={label}
        description={description}
        value={value}
        onChange={onChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setQuery(title || '');
            setStockOpen(true);
          }}
          className="rounded-button border border-[#dde5e9] bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
        >
          Find relevant images
        </button>
        {contentType && recordId ? (
          <GenerateImageControl
            contentType={contentType}
            recordId={recordId}
            title={title || label}
            currentImageUrl={value}
            onAttached={onChange}
          />
        ) : (
          <p className="text-xs text-ink-muted">Save the record first, then you can generate an image with Gemini.</p>
        )}
      </div>

      {stockOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Find relevant images"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-[#dde5e9] bg-white shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-[#dde5e9] px-5 py-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Find relevant images</h3>
                <p className="text-xs text-ink-muted">
                  Browse medical photographs matched to this CMS record. Selected images appear on the public page.
                </p>
              </div>
              <button type="button" onClick={() => setStockOpen(false)} className="text-sm text-ink-muted">
                ✕
              </button>
            </div>
            <div className="border-b border-[#dde5e9] p-4">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cardiology, surgery, paediatrics..."
                className="w-full rounded-xl border border-[#d2d6dc] px-3.5 py-2 text-sm focus:border-brand-700 focus:outline-none"
              />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    onChange(image.url);
                    setStockOpen(false);
                  }}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    value === image.url ? 'border-brand-700 ring-2 ring-brand-700/20' : 'border-[#dde5e9] hover:border-brand-700'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.alt} className="aspect-video w-full object-cover" />
                  <span className="block px-2 py-1.5 text-[11px] font-medium text-ink">{image.alt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
