import { describe, expect, it } from 'vitest';
import {
  assertImageGenerationConfigured,
  resolveImageGenerationProviderName,
} from '../config';
import { DomainError } from '@/server/errors/domain-error';

describe('image generation config', () => {
  it('allows the mock provider outside production', () => {
    const previous = process.env.IMAGE_GENERATION_PROVIDER;
    process.env.IMAGE_GENERATION_PROVIDER = 'mock';
    try {
      expect(resolveImageGenerationProviderName()).toBe('mock');
    } finally {
      if (previous === undefined) delete process.env.IMAGE_GENERATION_PROVIDER;
      else process.env.IMAGE_GENERATION_PROVIDER = previous;
    }
  });

  it('returns a configuration error when the gateway is not configured locally', () => {
    const previousProvider = process.env.IMAGE_GENERATION_PROVIDER;
    const previousKey = process.env.AI_GATEWAY_API_KEY;
    const previousVercel = process.env.VERCEL;
    process.env.IMAGE_GENERATION_PROVIDER = 'gateway';
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL;
    try {
      expect(() => assertImageGenerationConfigured()).toThrow(DomainError);
    } finally {
      if (previousProvider === undefined) delete process.env.IMAGE_GENERATION_PROVIDER;
      else process.env.IMAGE_GENERATION_PROVIDER = previousProvider;
      if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = previousKey;
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
    }
  });
});
