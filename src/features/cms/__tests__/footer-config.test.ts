import { describe, expect, it } from 'vitest';
import { defaultFooterConfig, parseFooterConfig } from '../footer-config';

describe('footer CMS config', () => {
  it('returns the current public footer defaults', () => {
    const config = defaultFooterConfig('CarePulse Hospital');
    expect(config.columns).toHaveLength(3);
    expect(config.columns[0]?.links[0]?.href).toBe('/about/overview');
    expect(config.legalLinks.map((link) => link.label)).toEqual(['Privacy', 'Terms', 'Accessibility']);
    expect(config.showLogin).toBe(false);
  });

  it('rejects open redirects and script URLs in saved links', () => {
    const parsed = parseFooterConfig({
      columns: [
        {
          title: 'Hospital',
          links: [
            { href: 'https://evil.com', label: 'Phish' },
            { href: '//evil.com', label: 'Protocol relative' },
            { href: 'javascript:alert(1)', label: 'XSS' },
            { href: '/departments', label: 'Departments' },
          ],
        },
      ],
      legalLinks: [{ href: '/privacy', label: 'Privacy' }],
      loginLabel: 'Sign in',
      showLogin: true,
    });

    expect(parsed.columns[0]?.links).toEqual([{ href: '/departments', label: 'Departments' }]);
    expect(parsed.loginLabel).toBe('Sign in');
    expect(parsed.showLogin).toBe(true);
  });

  it('merges duplicate columns and drops repeated hrefs', () => {
    const parsed = parseFooterConfig({
      columns: [
        {
          title: 'Hospital',
          links: [
            { href: '/contact', label: 'Contact' },
            { href: '/contact', label: 'Contact again' },
          ],
        },
        {
          title: 'Hospital',
          links: [{ href: '/locations', label: 'Locations' }],
        },
      ],
      showLogin: false,
    });
    expect(parsed.columns).toHaveLength(1);
    expect(parsed.columns[0]?.links.map((link) => link.href)).toEqual(['/contact', '/locations']);
  });

  it('strips HTML from labels and falls back when every custom link is invalid', () => {
    const parsed = parseFooterConfig({
      columns: [{ title: '<b>Hack</b>', links: [{ href: 'https://evil.com', label: '<script>x</script>' }] }],
      legalLinks: [],
    });
    expect(parsed.columns[0]?.title).toBe('Hospital');
    expect(parsed.legalLinks[0]?.href).toBe('/privacy');
  });
});
