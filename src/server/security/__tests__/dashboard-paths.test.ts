import { isDashboardPath, safeInternalPath } from '../dashboard-paths';
import { describe, expect, it } from 'vitest';

describe('isDashboardPath', () => {
  it('protects patient portal routes without matching public CMS', () => {
    expect(isDashboardPath('/patient', '/patient')).toBe(true);
    expect(isDashboardPath('/patient/doctors', '/patient')).toBe(true);
    expect(isDashboardPath('/patient/doctors/abc', '/patient')).toBe(true);
    expect(isDashboardPath('/patient-resources', '/patient')).toBe(false);
    expect(isDashboardPath('/patient-resources/faq', '/patient')).toBe(false);
  });

  it('protects doctor portal routes without matching public /doctors', () => {
    expect(isDashboardPath('/doctor', '/doctor')).toBe(true);
    expect(isDashboardPath('/doctor/dashboard', '/doctor')).toBe(true);
    expect(isDashboardPath('/doctors', '/doctor')).toBe(false);
    expect(isDashboardPath('/doctors/jane-smith', '/doctor')).toBe(false);
  });

  it('protects admin portal routes', () => {
    expect(isDashboardPath('/admin', '/admin')).toBe(true);
    expect(isDashboardPath('/admin/dashboard', '/admin')).toBe(true);
    expect(isDashboardPath('/administration', '/admin')).toBe(false);
  });
});

describe('safeInternalPath', () => {
  it('allows relative application paths', () => {
    expect(safeInternalPath('/patient/dashboard')).toBe('/patient/dashboard');
    expect(safeInternalPath('/book-appointment')).toBe('/book-appointment');
    expect(safeInternalPath('/doctors/jane-smith?from=home')).toBe('/doctors/jane-smith?from=home');
  });

  it('rejects open redirects', () => {
    expect(safeInternalPath('https://evil.com')).toBeNull();
    expect(safeInternalPath('http://evil.com/phish')).toBeNull();
    expect(safeInternalPath('//evil.com')).toBeNull();
    expect(safeInternalPath('///evil.com')).toBeNull();
    expect(safeInternalPath('/\\evil.com')).toBeNull();
    expect(safeInternalPath('/\\\\evil.com')).toBeNull();
    expect(safeInternalPath('/%2F%2Fevil.com')).toBeNull();
    expect(safeInternalPath('/%2f%2fevil.com')).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath('')).toBeNull();
    expect(safeInternalPath('javascript:alert(1)')).toBeNull();
  });
});
