import type { CmsImagePromptType, ImageAspectRatio, ImageStyle } from '@/server/ai/image-generation';

export type CmsImageContentType = CmsImagePromptType;

export interface CmsImageRecordSummary {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  slug?: string | null;
}

export interface GenerateCmsImageInput {
  contentType: CmsImageContentType;
  recordId: string;
  style?: ImageStyle;
  aspectRatio?: ImageAspectRatio;
}

export interface GeneratedCmsImageResult {
  mediaId: string;
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
}

export interface AttachCmsImageInput {
  contentType: CmsImageContentType;
  recordId: string;
  mediaId: string;
  replaceExisting?: boolean;
}

export interface BulkGenerateCmsImagesInput {
  contentType: CmsImageContentType;
  recordIds: string[];
  missingOnly?: boolean;
  style?: ImageStyle;
}
