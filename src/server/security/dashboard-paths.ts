/**
 * Dashboard route matching must not use naive startsWith('/patient') or
 * startsWith('/doctor') — those collide with public CMS paths:
 *   /patient-resources, /doctors, /doctors/:id
 */
export function isDashboardPath(pathname: string, prefix: '/patient' | '/doctor' | '/admin'): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
