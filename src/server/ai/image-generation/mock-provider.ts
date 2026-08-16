import sharp from 'sharp';
import type { GeneratedImage, GenerateImageOptions, ImageGenerationProvider } from './types';

export class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly name = 'mock';

  async generateImage(options: GenerateImageOptions): Promise<GeneratedImage> {
    const delayMs = Number(process.env.IMAGE_GENERATION_DELAY_MS || '0');
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    if (options.signal?.aborted) {
      throw new Error('Image generation timed out.');
    }

    const size =
      options.aspectRatio === '1:1'
        ? { width: 1200, height: 1200 }
        : { width: 1600, height: 900 };

    const bytes = await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 3,
        background: { r: 15, g: 74, b: 86 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    return { bytes, mimeType: 'image/webp' };
  }
}
