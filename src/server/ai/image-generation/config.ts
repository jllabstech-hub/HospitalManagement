import { DomainError } from '@/server/errors/domain-error';

export type ImageGenerationProviderName = 'gateway' | 'mock';

const DEFAULT_MODEL = 'google/gemini-3.1-flash-image-preview';

export function isMockImageGenerationAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function resolveImageGenerationProviderName(): ImageGenerationProviderName {
  const raw = (process.env.IMAGE_GENERATION_PROVIDER || 'gateway').trim().toLowerCase();
  if (raw === 'mock') {
    if (!isMockImageGenerationAllowed()) {
      throw new DomainError(
        'CONFIGURATION_ERROR',
        'IMAGE_GENERATION_PROVIDER=mock is forbidden in production.',
        'Image generation is not configured.',
        503
      );
    }
    return 'mock';
  }
  return 'gateway';
}

export function resolveImageGenerationModel(): string {
  return (process.env.IMAGE_GENERATION_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

export function assertImageGenerationConfigured(): void {
  const provider = resolveImageGenerationProviderName();
  if (provider === 'mock') return;

  const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
  const onVercel = process.env.VERCEL === '1';
  if (!hasGatewayKey && !onVercel) {
    throw new DomainError(
      'CONFIGURATION_ERROR',
      'Image generation is not configured. Set AI_GATEWAY_API_KEY or deploy on Vercel with AI Gateway enabled.',
      'Image generation is not configured. Add AI_GATEWAY_API_KEY, then try again.',
      503
    );
  }
}

export function mapImageGenerationError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('not configured') ||
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('oidc')
  ) {
    return new DomainError(
      'CONFIGURATION_ERROR',
      message,
      'Image generation is not configured. Add AI_GATEWAY_API_KEY, then try again.',
      503
    );
  }
  if (lower.includes('429') || lower.includes('rate limit')) {
    return new DomainError(
      'RATE_LIMITED',
      message,
      'Image generation is busy. Please try again in a moment.',
      429
    );
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) {
    return new DomainError(
      'INTERNAL_SERVER_ERROR',
      message,
      'Image generation timed out. Please try again.',
      504
    );
  }
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('policy')) {
    return new DomainError(
      'VALIDATION_ERROR',
      message,
      'Unable to generate image because of content safety rules. Please try again.',
      400
    );
  }
  return new DomainError(
    'INTERNAL_SERVER_ERROR',
    message || 'Unable to generate image.',
    'Unable to generate image. Please try again.',
    502
  );
}
