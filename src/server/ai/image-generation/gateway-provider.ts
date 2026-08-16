import { generateText } from 'ai';
import { DomainError } from '@/server/errors/domain-error';
import {
  assertImageGenerationConfigured,
  mapImageGenerationError,
  resolveImageGenerationModel,
} from './config';
import type { GeneratedImage, GenerateImageOptions, ImageGenerationProvider } from './types';

const GENERATION_TIMEOUT_MS = 90_000;

function fileToBuffer(file: {
  uint8Array?: Uint8Array;
  data?: Uint8Array | Buffer;
  base64?: string;
  mediaType?: string;
}): Buffer {
  if (file.uint8Array) return Buffer.from(file.uint8Array);
  if (file.data) return Buffer.from(file.data);
  if (file.base64) return Buffer.from(file.base64, 'base64');
  throw new DomainError(
    'INTERNAL_SERVER_ERROR',
    'Image generation returned an empty file.',
    'Unable to generate image. Please try again.',
    502
  );
}

export class GatewayImageGenerationProvider implements ImageGenerationProvider {
  readonly name = 'gateway';

  async generateImage(options: GenerateImageOptions): Promise<GeneratedImage> {
    assertImageGenerationConfigured();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    try {
      const result = await generateText({
        model: resolveImageGenerationModel(),
        prompt: options.prompt,
        abortSignal: controller.signal,
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        },
      });

      const images = (result.files ?? []).filter((file) =>
        (file.mediaType || '').toLowerCase().startsWith('image/')
      );
      const image = images[0];
      if (!image) {
        throw new DomainError(
          'INTERNAL_SERVER_ERROR',
          'Image generation returned no image files.',
          'Unable to generate image. Please try again.',
          502
        );
      }

      const bytes = fileToBuffer(image);
      if (!bytes.length) {
        throw new DomainError(
          'INTERNAL_SERVER_ERROR',
          'Image generation returned an empty image.',
          'Unable to generate image. Please try again.',
          502
        );
      }

      return {
        bytes,
        mimeType: image.mediaType || 'image/png',
      };
    } catch (error) {
      throw mapImageGenerationError(error);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  }
}
