import { afterEach, describe, expect, it } from 'vitest';
import { isSingleTenantMode } from '../types';

describe('isSingleTenantMode', () => {
  const orig = process.env.SINGLE_TENANT;

  afterEach(() => {
    if (orig === undefined) delete process.env.SINGLE_TENANT;
    else process.env.SINGLE_TENANT = orig;
  });

  it('defaults to a single hospital when unset', () => {
    delete process.env.SINGLE_TENANT;
    expect(isSingleTenantMode()).toBe(true);
  });

  it('treats empty as single hospital', () => {
    process.env.SINGLE_TENANT = '';
    expect(isSingleTenantMode()).toBe(true);
  });

  it('can be disabled for multi-hospital hosting', () => {
    process.env.SINGLE_TENANT = 'false';
    expect(isSingleTenantMode()).toBe(false);
    process.env.SINGLE_TENANT = '0';
    expect(isSingleTenantMode()).toBe(false);
  });
});
