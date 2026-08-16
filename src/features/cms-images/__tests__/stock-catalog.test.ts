import { describe, expect, it } from 'vitest';
import { isCatalogImageUrl, matchStockImage, searchStockImages } from '../stock-catalog';
import { isDisplayableCmsImageUrl, sanitizeCmsImageUrl } from '../urls';

describe('CMS stock catalog', () => {
  it('matches cardiology to a heart image', () => {
    const image = matchStockImage('Cardiology', 'Heart and cardiovascular care');
    expect(image.keywords.some((keyword) => /cardio|heart|cardiac/.test(keyword))).toBe(true);
  });

  it('searches relevant medical photographs', () => {
    const results = searchStockImages('paediatric child');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.alt.toLowerCase()).toMatch(/paediatric|child/);
  });

  it('recognises catalog URLs', () => {
    const image = matchStockImage('Neurology');
    expect(isCatalogImageUrl(image.url)).toBe(true);
    expect(isCatalogImageUrl('https://evil.example/photo.jpg')).toBe(false);
  });
});

describe('CMS image URL allowlist', () => {
  it('allows unsplash and uploaded paths', () => {
    expect(isDisplayableCmsImageUrl('https://images.unsplash.com/photo-123?auto=format')).toBe(true);
    expect(isDisplayableCmsImageUrl('/uploads/tenant/photo.webp')).toBe(true);
    expect(sanitizeCmsImageUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeCmsImageUrl('http://images.unsplash.com/photo-123')).toBeNull();
  });
});
