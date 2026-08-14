'use client';

import { useTransition } from 'react';
import { deleteMediaAssetAction } from '@/features/media/actions';

export default function DeleteMediaButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    startTransition(async () => {
      const res = await deleteMediaAssetAction(id);
      if (!res.success) {
        alert(res.error || 'Failed to delete asset');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-200 shadow-sm disabled:opacity-50"
      title="Delete Asset"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
