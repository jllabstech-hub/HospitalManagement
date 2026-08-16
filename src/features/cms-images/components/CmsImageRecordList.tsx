'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { BusyLabel } from '@/components/ui/Spinner';
import { fillMissingCmsImagesFromCatalogAction } from '../actions';
import type { CmsImageContentType } from '../types';
import BrowseImageControl from './BrowseImageControl';
import CmsImageStatus from './CmsImageStatus';
import GenerateImageControl from './GenerateImageControl';

export interface CmsImageListItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface CmsImageRecordListProps {
  contentType: CmsImageContentType;
  records: CmsImageListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  missingCount?: number;
  fillAllMissing?: boolean;
}

export default function CmsImageRecordList({
  contentType,
  records,
  onEdit,
  onDelete,
  missingCount,
  fillAllMissing = false,
}: CmsImageRecordListProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const missingOnPage = useMemo(() => records.filter((record) => !record.imageUrl), [records]);
  const missing = missingCount ?? missingOnPage.length;

  const fillMissing = async () => {
    if (running || missing === 0) return;
    setRunning(true);
    setMessage(null);
    const result = await fillMissingCmsImagesFromCatalogAction({
      contentType,
      ...(fillAllMissing ? {} : { recordIds: missingOnPage.map((item) => item.id) }),
    });
    setRunning(false);
    if (!result.success) {
      setMessage(result.error || 'Unable to attach images.');
      return;
    }
    setMessage(`Attached ${result.data?.attached ?? 0} relevant image${result.data?.attached === 1 ? '' : 's'}.`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-[#dde5e9] bg-white p-3">
        <Button variant="outline" size="sm" disabled={running || missing === 0} onClick={fillMissing}>
          Fill missing images
        </Button>
        {running ? (
          <span className="text-xs text-ink-muted" role="status" aria-live="polite">
            <BusyLabel>Attaching relevant images...</BusyLabel>
          </span>
        ) : (
          <span className="text-xs text-ink-muted">{missing} missing images</span>
        )}
        {message ? <span className="text-xs font-medium text-brand-800">{message}</span> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((item) => (
          <div key={item.id} className="overflow-hidden rounded border bg-white p-4">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="-mx-4 -mt-4 mb-4 aspect-video w-[calc(100%+2rem)] object-cover" />
            ) : (
              <div className="-mx-4 -mt-4 mb-4 flex aspect-video items-center justify-center bg-surface-warm text-xs text-ink-muted">
                No image yet
              </div>
            )}
            <p className="font-bold">{item.title}</p>
            <div className="mt-2">
              <CmsImageStatus imageUrl={item.imageUrl} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <BrowseImageControl
                contentType={contentType}
                recordId={item.id}
                title={item.title}
                currentImageUrl={item.imageUrl}
              />
              <GenerateImageControl
                contentType={contentType}
                recordId={item.id}
                title={item.title}
                currentImageUrl={item.imageUrl}
              />
              <button type="button" onClick={() => onEdit(item.id)} className="text-sm text-brand-600">
                Edit
              </button>
              <button type="button" onClick={() => onDelete(item.id)} className="text-sm text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
