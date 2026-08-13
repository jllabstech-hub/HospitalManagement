'use client';

import { useRouter } from 'next/navigation';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';

export default function MediaUploadWrapper() {
  const router = useRouter();

  return (
    <ImageUploadPicker
      label="Select File"
      description="Upload JPG, PNG, WebP, or SVG assets up to 5MB."
      value=""
      onChange={() => {
        // Refresh the page data so the newly uploaded asset appears in the grid
        router.refresh();
      }}
    />
  );
}
