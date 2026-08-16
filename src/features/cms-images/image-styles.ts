import type { ImageStyle } from '@/server/ai/image-generation/types';

export const CMS_IMAGE_STYLES: Array<{ id: ImageStyle; label: string }> = [
  { id: 'medical-editorial', label: 'Medical editorial' },
  { id: 'clinical-illustration', label: 'Clinical illustration' },
  { id: 'modern-hospital', label: 'Modern hospital' },
  { id: 'abstract-medical', label: 'Abstract medical' },
];
