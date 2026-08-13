import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role } from '@prisma/client';

const mockAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

import {
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
} from '../actions';
import { prisma } from '@/server/db/client';

describe('Department Management Server Actions & Security', () => {
  beforeEach(async () => {
    mockAuth.mockReset();
    // Clean up test departments with unique test pattern
    await prisma.appointment.deleteMany({
      where: { doctor: { department: { name: { contains: 'dept.test.crud' } } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { department: { name: { contains: 'dept.test.crud' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { department: { name: { contains: 'dept.test.crud' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { department: { name: { contains: 'dept.test.crud' } } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'dept.test.crud' } },
    });
  });

  it('1 & 2: Should allow Admin to create department and reject Non-Admin', async () => {
    // 1. Non-Admin (PATIENT) should be rejected
    mockAuth.mockResolvedValueOnce({
      user: { id: 'patient-1', email: 'patient@example.com', role: Role.PATIENT, isActive: true },
    });

    const resPatient = await createDepartmentAction({
      name: 'dept.test.crud NonAdmin',
      description: 'Test description',
    });

    expect(resPatient.success).toBe(false);
    if (!resPatient.success) {
      expect(resPatient.error).toBe('You do not have permission to access this resource.');
    }

    // 2. Admin should succeed
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const resAdmin = await createDepartmentAction({
      name: 'dept.test.crud Admin',
      description: 'Test description created by admin',
    });

    expect(resAdmin.success).toBe(true);
    if (!resAdmin.success || !resAdmin.data) return;
    expect(resAdmin.data.id).toBeDefined();

    const dbRecord = await prisma.department.findUnique({
      where: { id: resAdmin.data.id },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.description).toBe('Test description created by admin');
    expect(dbRecord?.isActive).toBe(true);
  });

  it('3: Should reject duplicate department names case-insensitively', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    await createDepartmentAction({
      name: 'dept.test.crud Unique',
      description: 'Original department',
    });

    // Attempt exact duplicate
    const resExact = await createDepartmentAction({
      name: 'dept.test.crud Unique',
      description: 'Duplicate exact',
    });
    expect(resExact.success).toBe(false);
    if (!resExact.success) {
      expect(resExact.error).toContain('already exists');
    }

    // Attempt case-insensitive duplicate
    const resCase = await createDepartmentAction({
      name: 'DEPT.TEST.CRUD UNIQUE',
      description: 'Duplicate uppercase',
    });
    expect(resCase.success).toBe(false);
    if (!resCase.success) {
      expect(resCase.error).toContain('already exists');
    }
  });

  it('4, 6 & 7: Should allow Admin to edit, deactivate, and reactivate department', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const created = await createDepartmentAction({
      name: 'dept.test.crud Lifecycle',
      description: 'Initial description',
    });

    expect(created.success).toBe(true);
    if (!created.success || !created.data) return;
    const deptId = created.data.id;

    // Edit
    const editRes = await updateDepartmentAction({
      id: deptId,
      name: 'dept.test.crud Lifecycle Updated',
      description: 'Updated description',
    });
    expect(editRes.success).toBe(true);

    const dbUpdated = await prisma.department.findUnique({ where: { id: deptId } });
    expect(dbUpdated?.name).toBe('dept.test.crud Lifecycle Updated');

    // Deactivate
    const deactRes = await toggleDepartmentStatusAction(deptId);
    expect(deactRes.success).toBe(true);

    const dbDeact = await prisma.department.findUnique({ where: { id: deptId } });
    expect(dbDeact?.isActive).toBe(false);

    // Reactivate
    const reactRes = await toggleDepartmentStatusAction(deptId);
    expect(reactRes.success).toBe(true);

    const dbReact = await prisma.department.findUnique({ where: { id: deptId } });
    expect(dbReact?.isActive).toBe(true);
  });
  it('8: Should isolate departments by tenant (Hospital A and Hospital B can both have Cardiology)', async () => {
    // 1. Create two distinct tenants (hospitals)
    const tenantA = await prisma.hospitalProfile.create({
      data: {
        hospitalName: 'Hospital A',
        legalName: 'Hospital A LLC',
        phone: '123',
        email: 'a@a.com',
        addressLine1: '1',
        city: 'A',
        state: 'A',
        country: 'A',
      }
    });

    const tenantB = await prisma.hospitalProfile.create({
      data: {
        hospitalName: 'Hospital B',
        legalName: 'Hospital B LLC',
        phone: '123',
        email: 'b@b.com',
        addressLine1: '1',
        city: 'B',
        state: 'B',
        country: 'B',
      }
    });

    // 2. Admin A creates Cardiology
    mockAuth.mockResolvedValue({
      user: { id: 'admin-a', email: 'adminA@hospital.com', role: Role.ADMIN, isActive: true, tenantId: tenantA.id },
    });

    const resA = await createDepartmentAction({
      name: 'Cardiology',
      description: 'Heart',
    });
    expect(resA.success).toBe(true);

    // 3. Admin B creates Cardiology (same name, should succeed because it's tenant-scoped)
    mockAuth.mockResolvedValue({
      user: { id: 'admin-b', email: 'adminB@hospital.com', role: Role.ADMIN, isActive: true, tenantId: tenantB.id },
    });

    const resB = await createDepartmentAction({
      name: 'Cardiology',
      description: 'Heart B',
    });
    expect(resB.success).toBe(true); // Fails if unique constraint is global

    if (!resB.success || !resB.data) return;
    const deptBId = resB.data.id;

    // 4. Verify Admin A cannot modify Admin B's Cardiology department
    mockAuth.mockResolvedValue({
      user: { id: 'admin-a', email: 'adminA@hospital.com', role: Role.ADMIN, isActive: true, tenantId: tenantA.id },
    });

    const editRes = await updateDepartmentAction({
      id: deptBId, // Admin A trying to edit Admin B's dept
      name: 'Cardiology Hacked',
      description: 'Hacked',
    });

    expect(editRes.success).toBe(false);
    if (!editRes.success) {
      expect(editRes.error).toBe('Department not found.'); // Because tenantId doesn't match in findFirst
    }
  });
});
