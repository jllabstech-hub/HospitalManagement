import { resolveImageGenerationProviderName } from './config';
import { GatewayImageGenerationProvider } from './gateway-provider';
import { MockImageGenerationProvider } from './mock-provider';
import type { ImageGenerationProvider } from './types';

export type { CmsImagePromptInput, CmsImagePromptType } from './prompt';
export { buildCmsImageAltText, buildCmsImagePrompt } from './prompt';
export { IMAGE_STYLES } from './types';
export type { GeneratedImage, GenerateImageOptions, ImageAspectRatio, ImageGenerationProvider, ImageStyle } from './types';

let cached: ImageGenerationProvider | null = null;
let cachedName: string | null = null;

export function getImageGenerationProvider(): ImageGenerationProvider {
  const name = resolveImageGenerationProviderName();
  if (cached && cachedName === name) return cached;
  cachedName = name;
  cached = name === 'mock' ? new MockImageGenerationProvider() : new GatewayImageGenerationProvider();
  return cached;
}

export function resetImageGenerationProviderCache(): void {
  cached = null;
  cachedName = null;
}
