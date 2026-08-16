export type ImageAspectRatio = '16:9' | '1:1';

export type ImageStyle =
  | 'medical-editorial'
  | 'clinical-illustration'
  | 'modern-hospital'
  | 'abstract-medical';

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: ImageAspectRatio;
  style?: ImageStyle;
  signal?: AbortSignal;
}

export interface GeneratedImage {
  bytes: Buffer;
  mimeType: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generateImage(options: GenerateImageOptions): Promise<GeneratedImage>;
}

export const IMAGE_STYLES: Array<{ id: ImageStyle; label: string }> = [
  { id: 'medical-editorial', label: 'Medical editorial' },
  { id: 'clinical-illustration', label: 'Clinical illustration' },
  { id: 'modern-hospital', label: 'Modern hospital' },
  { id: 'abstract-medical', label: 'Abstract medical' },
];
