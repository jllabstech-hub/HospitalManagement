import { describe, it, expect, beforeEach } from 'vitest';
import { Role } from '@prisma/client';
import { searchDoctors, getDoctorPublicProfile, getPublicDepartments } from '../queries';
import { prisma } from '@/server/db/client';

describe('Patient Doctor Discovery Queries & Security Projection', () => {
  let activeDeptId: string;
  let inactiveDeptId: string;
  let doctorAProfileId: string;

  beforeEach(async () => {
    // Clean up test doctors and users with unique email pattern
    await prisma.blockedDate.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'doc.search.test' } } } },
          { doctor: { department: { name: { contains: 'Search Test Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'doc.search.test' } } } },
          { doctor: { department: { name: { contains: 'Search Test Dept' } } } },
        ],
      },
    });
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'doc.search.test' } } } },
          { doctor: { department: { name: { contains: 'Search Test Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'doc.search.test' } } },
          { department: { name: { contains: 'Search Test Dept' } } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'doc.search.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Search Test Dept' } },
    });

    // Create Active & Inactive Test Departments
    const activeDept = await prisma.department.create({
      data: { name: 'Search Test Dept Active', slug: 'search-test-dept-active', isActive: true },
    });
    activeDeptId = activeDept.id;

    const inactiveDept = await prisma.department.create({
      data: { name: 'Search Test Dept Inactive', slug: 'search-test-dept-inactive', isActive: false },
    });
    inactiveDeptId = inactiveDept.id;

    // Create Active Doctor A (Active Dept)
    const userA = await prisma.user.create({
      data: {
        email: 'doc.search.test.active@hospital.com',
        passwordHash: 'secretHash123',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: userA.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Alice Specialist',
        slug: 'doc-search-alice',
        phoneNumber: '+91 99999 11111',
        qualification: 'MBBS, MD Cardiology',
        experienceYears: 10,
        bio: 'Cardiovascular heart expert.',
      },
    });
    doctorAProfileId = docA.id;

    // Create Inactive Doctor B (Active Dept)
    const userB = await prisma.user.create({
      data: {
        email: 'doc.search.test.inactuser@hospital.com',
        passwordHash: 'secretHash123',
        role: Role.DOCTOR,
        isActive: false, // Inactive user account
      },
    });
    await prisma.doctorProfile.create({
      data: {
        userId: userB.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Bob Inactive',
        slug: 'doc-search-bob-inactive',
        phoneNumber: '+91 99999 22222',
        qualification: 'MBBS',
        experienceYears: 5,
      },
    });

    // Create Doctor C (Inactive Dept)
    const userC = await prisma.user.create({
      data: {
        email: 'doc.search.test.inactdept@hospital.com',
        passwordHash: 'secretHash123',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    await prisma.doctorProfile.create({
      data: {
        userId: userC.id,
        departmentId: inactiveDeptId, // Inactive department
        fullName: 'Dr. Charlie InactiveDept',
        slug: 'doc-search-charlie-inactdept',
        phoneNumber: '+91 99999 33333',
        qualification: 'MBBS',
        experienceYears: 7,
      },
    });
  });

  it('1, 2 & 3: Should return active doctors in active departments and exclude inactive doctors/departments', async () => {
    const res = await searchDoctors({ search: 'Alice' });
    const doctorNames = res.doctors.map((d) => d.fullName);

    expect(doctorNames).toContain('Dr. Alice Specialist');
    expect(doctorNames).not.toContain('Dr. Bob Inactive');
    expect(doctorNames).not.toContain('Dr. Charlie InactiveDept');
  });

  it('4 & 7: Should perform case-insensitive name search', async () => {
    const resUpper = await searchDoctors({ search: 'ALICE' });
    expect(resUpper.doctors.some((d) => d.fullName === 'Dr. Alice Specialist')).toBe(true);

    const resLower = await searchDoctors({ search: 'alice' });
    expect(resLower.doctors.some((d) => d.fullName === 'Dr. Alice Specialist')).toBe(true);
  });

  it('5: Should perform specialization search via qualification keyword', async () => {
    const res = await searchDoctors({ search: 'Cardiology' });
    expect(res.doctors.some((d) => d.fullName === 'Dr. Alice Specialist')).toBe(true);
  });

  it('6: Should filter doctors by department ID', async () => {
    const resMatching = await searchDoctors({ departmentId: activeDeptId });
    expect(resMatching.doctors.some((d) => d.id === doctorAProfileId)).toBe(true);

    const resInactiveDept = await searchDoctors({ departmentId: inactiveDeptId });
    expect(resInactiveDept.doctors).toHaveLength(0); // Inactive department filtered out
  });

  it('8: Should handle pagination correctly', async () => {
    const resPage1 = await searchDoctors({ limit: 1 });
    expect(resPage1.doctors).toHaveLength(1);
    expect(resPage1.currentPage).toBe(1);
    expect(resPage1.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('9 & 10: Should return empty results for non-matching search or invalid department', async () => {
    const resNonMatching = await searchDoctors({ search: 'NonExistentDoctorNameXYZ' });
    expect(resNonMatching.doctors).toHaveLength(0);
    expect(resNonMatching.totalCount).toBe(0);

    const resInvalidDept = await searchDoctors({ departmentId: '00000000-0000-0000-0000-000000000000' });
    expect(resInvalidDept.doctors).toHaveLength(0);
  });

  it('11 & 12: Should retrieve public doctor profile safely and strictly exclude passwordHash', async () => {
    const doc = await getDoctorPublicProfile(doctorAProfileId);
    expect(doc).not.toBeNull();
    expect(doc?.fullName).toBe('Dr. Alice Specialist');
    expect(doc?.department.id).toBe(activeDeptId);

    // Verify passwordHash is NOT present in projected payload
    expect((doc as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(((doc as unknown as Record<string, unknown>).user as Record<string, unknown>).passwordHash).toBeUndefined();

    const nonExistent = await getDoctorPublicProfile('00000000-0000-0000-0000-000000000000');
    expect(nonExistent).toBeNull();
  });

  it('Should retrieve active public departments only', async () => {
    const depts = await getPublicDepartments();
    const deptNames = depts.map((d) => d.name);

    expect(deptNames).toContain('Search Test Dept Active');
    expect(deptNames).not.toContain('Search Test Dept Inactive');
  });
});
