import { isDashboardPath } from '../dashboard-paths';
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
