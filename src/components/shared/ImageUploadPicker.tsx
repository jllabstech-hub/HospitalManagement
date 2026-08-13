'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  type: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

interface ImageUploadPickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
}

export default function ImageUploadPicker({
  value,
  onChange,
  label = 'Media Asset Image',
  description = 'Upload a new photo or select an asset from the media library.',
}: ImageUploadPickerProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch Media Library Assets
  const fetchMedia = async (q: string = '') => {
    try {
      const res = await fetch(`/api/upload?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (isLibraryOpen) {
      fetchMedia(search);
    }
  }, [isLibraryOpen, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', file.name);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.media.url);
      setIsUploading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      setError(msg);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-ink">{label}</label>
      {description && <p className="text-[11px] text-ink-muted">{description}</p>}

      {/* Preview Area */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-24 overflow-hidden rounded-button border border-[#dde5e9] bg-surface-warm">
          {value ? (
            <Image src={value} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-soft">
              No Image
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {/* File Upload Button */}
          <label className="cursor-pointer rounded-button bg-brand-700 px-3 py-2 font-semibold text-white transition hover:bg-brand-800">
            {isUploading ? 'Uploading...' : 'Upload Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {/* Media Library Picker Trigger */}
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="rounded-button border border-[#dde5e9] bg-white px-3 py-2 font-semibold text-ink hover:bg-surface-soft"
          >
            Browse Library
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-button border border-rose-200 bg-rose-50 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}

      {/* Media Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-[#dde5e9] bg-white shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#dde5e9] px-5 py-4">
              <div>
                <h3 className="font-bold text-ink">Media Library Picker</h3>
                <p className="text-xs text-ink-muted">Select an uploaded media asset</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="rounded-full p-1 text-xs font-bold text-ink-soft hover:bg-surface-soft hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-[#dde5e9]">
              <input
                type="text"
                placeholder="Search assets by filename or alt text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-button border border-[#dde5e9] px-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {mediaList.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink-muted">
                  No media assets found in library.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {mediaList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setIsLibraryOpen(false);
                      }}
                      className={`group relative aspect-square overflow-hidden rounded-card border p-1 text-left transition ${
                        value === item.url ? 'border-brand-600 ring-2 ring-brand-200' : 'border-[#dde5e9] hover:border-brand-300'
                      }`}
                    >
                      <Image src={item.url} alt={item.altText || 'Asset'} fill className="object-cover" />
                      <div className="absolute inset-0 bg-brand-950/60 p-2 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end">
                        <span className="text-[10px] font-bold text-white truncate">{item.altText || item.url.split('/').pop()}</span>
                        {item.fileSize && (
                          <span className="text-[9px] text-white/80">{(item.fileSize / 1024).toFixed(1)} KB</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#dde5e9] bg-surface-soft p-3 text-right">
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="btn-secondary !py-1.5 !text-xs"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
