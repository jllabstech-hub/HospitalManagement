'use client';

import { useState, useEffect, useRef } from 'react';

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
  variant?: 'default' | 'doctor';
}

export default function ImageUploadPicker({
  value,
  onChange,
  label = 'Doctor Profile Photo',
  description = 'Upload a photo or select an existing asset for doctor cards and profiles.',
  variant = 'doctor',
}: ImageUploadPickerProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFile = async (file: File) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please drop a JPG or PNG image (max 5MB).');
      return;
    }
    processFile(file);
  };

  const dropZone = (
    <div
      role="button"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition ${
        isDragging
          ? 'border-[#0f4c5c] bg-[#eaf1f0]'
          : 'border-[#c4cdd5] bg-[#f4f7f6] hover:border-[#0f4c5c] hover:bg-[#eaf1f0]'
      }`}
    >
      <svg className="h-8 w-8 text-[#0f4c5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="mt-2 text-sm font-semibold text-[#111927]">Drag & Drop Photo Here or Browse Library.</p>
      <p className="mt-1 text-[11px] font-medium text-[#6c737f]">Supports JPG, PNG, max 5MB.</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );

  const actionButtons = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="rounded-lg bg-[#0f4c5c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0c3d4a] disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload Photo'}
      </button>
      <button
        type="button"
        onClick={() => setIsLibraryOpen(true)}
        className="rounded-lg bg-[#6c737f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#4b515d]"
      >
        Browse Library
      </button>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
        >
          Remove
        </button>
      ) : null}
    </div>
  );

  const libraryModal = isLibraryOpen ? (
    <MediaLibraryModal
      value={value}
      search={search}
      mediaList={mediaList}
      onSearch={setSearch}
      onClose={() => setIsLibraryOpen(false)}
      onSelect={(url) => {
        onChange(url);
        setIsLibraryOpen(false);
      }}
    />
  ) : null;

  if (variant === 'doctor') {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#111927]">{label}</label>
        {description ? <p className="text-[11px] font-medium text-[#6c737f]">{description}</p> : null}

        <div className="mt-2 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="col-span-1 sm:col-span-8">{dropZone}</div>
          <div className="col-span-1 sm:col-span-4 flex flex-col items-center justify-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#d2d6dc] bg-[#eef2f5] shadow-inner">
              {value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="Doctor Avatar" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-10 w-10 text-[#8c9ba5]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <span className="mt-1.5 text-[11px] font-semibold text-[#4b515d]">Current Photo</span>
          </div>
        </div>

        {actionButtons}
        {error ? <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p> : null}
        {libraryModal}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-ink">{label}</label>
      {description ? <p className="text-[11px] text-ink-muted">{description}</p> : null}
      {dropZone}
      {actionButtons}
      {value ? (
        <div className="overflow-hidden rounded-xl border border-[#dde5e9] bg-surface-warm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Selected image" className="max-h-40 w-full object-cover" />
        </div>
      ) : null}
      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
      {libraryModal}
    </div>
  );
}

function MediaLibraryModal({
  value,
  search,
  mediaList,
  onSearch,
  onClose,
  onSelect,
}: {
  value?: string | null;
  search: string;
  mediaList: MediaItem[];
  onSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#dde5e9] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#dde5e9] px-5 py-4">
          <div>
            <h3 className="font-bold text-[#111927]">Media Library</h3>
            <p className="text-xs text-[#6c737f]">Choose an uploaded image to use on this CMS record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-xs font-bold text-[#6c737f] hover:bg-[#f4f7f6] hover:text-[#111927]"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-[#dde5e9] p-4">
          <input
            type="text"
            placeholder="Search assets by filename or alt text..."
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="w-full rounded-xl border border-[#d2d6dc] px-3.5 py-2 text-xs focus:border-[#0f4c5c] focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mediaList.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6c737f]">No media assets found in library.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mediaList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.url)}
                  className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border p-1 text-left transition ${
                    value === item.url ? 'border-[#0f4c5c] ring-2 ring-[#0f4c5c]/20' : 'border-[#dde5e9] hover:border-[#0f4c5c]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.altText || 'Asset'} className="h-full w-full max-h-full max-w-full object-contain" />
                  <div className="absolute inset-0 flex flex-col justify-end bg-[#0f4c5c]/70 p-2 opacity-0 transition group-hover:opacity-100">
                    <span className="truncate text-[10px] font-bold text-white">
                      {item.altText || (item.url.startsWith('data:') ? 'Uploaded Asset' : item.url.split('/').pop())}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#dde5e9] bg-[#f8fafc] p-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d2d6dc] bg-white px-4 py-1.5 text-xs font-semibold text-[#374151] hover:bg-gray-50"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
}
