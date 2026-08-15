import { describe, it, expect } from 'vitest';
import { buildTenantNav } from '../build-tenant-nav';

describe('Tenant-aware CMS navigation', () => {
  it('only includes slugs supplied for the current tenant', () => {
    const navA = buildTenantNav({
      hospitalName: 'Hospital A',
      specialities: [{ name: 'Alpha Exclusive Care', slug: 'alpha-exclusive-care' }],
      centres: [{ name: 'Alpha Heart Centre', slug: 'alpha-heart' }],
    });
    const hrefs = navA.flatMap((item) => item.columns?.flatMap((col) => col.items.map((link) => link.href)) ?? []);
    expect(hrefs).toContain('/specialities/alpha-exclusive-care');
    expect(hrefs).toContain('/centres-of-excellence/alpha-heart');
    expect(hrefs).not.toContain('/specialities/beta-exclusive-care');
    expect(hrefs).not.toContain('/centres-of-excellence/heart-vascular-centre');
  });
});
