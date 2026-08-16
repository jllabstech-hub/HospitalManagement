import { describe, expect, it } from 'vitest';
import { shouldTrackNavigationClick } from '../navigation-progress';

const click = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

function anchor(href: string, extra: Partial<{ target: string; download: boolean }> = {}) {
  return {
    href,
    target: extra.target ?? '',
    hasAttribute: (name: string) => name === 'download' && Boolean(extra.download),
  };
}

describe('shouldTrackNavigationClick', () => {
  const here = new URL('http://localhost:5000/specialities');

  it('tracks in-app page changes', () => {
    expect(
      shouldTrackNavigationClick(click, anchor('http://localhost:5000/doctors'), here)
    ).toBe(true);
  });

  it('ignores the current page, new tabs, and external sites', () => {
    expect(shouldTrackNavigationClick(click, anchor('http://localhost:5000/specialities'), here)).toBe(false);
    expect(
      shouldTrackNavigationClick(click, anchor('http://localhost:5000/doctors', { target: '_blank' }), here)
    ).toBe(false);
    expect(shouldTrackNavigationClick(click, anchor('https://example.com/doctors'), here)).toBe(false);
  });
});
