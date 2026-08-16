import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { importPreviewToCms } from '../upsert';
import { emptyPreview } from '../extract';
import { runWithTenantContext } from '@/server/tenant';
import { getPublishedDepartments } from '@/features/cms/queries/catalog';

const PREFIX = 'cms.import.test';

function ctx(tenantId: string, host: string) {
  return {
    tenantId,
    hospitalName: host,
    timezone: 'Asia/Kolkata',
    customDomain: host,
    subdomain: null,
    isActive: true,
    host,
  };
}

describe('CMS import upsert and tenant isolation', () => {
  let tenantA: string;
  let tenantB: string;
  let adminA: string;

  beforeAll(async () => {
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.faqItem.deleteMany({ where: { question: { contains: PREFIX } } });
    await prisma.healthPackage.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });

    const a = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Import A', customDomain: `${PREFIX}-a.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    const b = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Import B', customDomain: `${PREFIX}-b.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    tenantA = a.id;
    tenantB = b.id;
    const admin = await prisma.user.create({
      data: { email: `${PREFIX}.admin.a@h.com`, passwordHash: 'x', role: Role.ADMIN, isActive: true, tenantId: tenantA },
    });
    adminA = admin.id;
  });

  afterAll(async () => {
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.faqItem.deleteMany({ where: { question: { contains: PREFIX } } });
    await prisma.healthPackage.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });
  });

  it('upserts without duplicating and keeps tenant isolation', async () => {
    const preview = emptyPreview();
    preview.departments = [{ name: `${PREFIX} Cardiology`, description: 'Cardiac care.' }];
    preview.faqs = [
      {
        name: `${PREFIX} How do I book?`,
        question: `${PREFIX} How do I book?`,
        answer: 'Call the desk.',
      },
    ];
    preview.packages = [{ name: `${PREFIX} Executive Health Check`, description: 'Includes ECG.', price: null }];

    const first = await importPreviewToCms({
      tenantId: tenantA,
      actorUserId: adminA,
      preview,
      categories: ['departments', 'faqs', 'packages'],
    });
    expect(first.totals.created).toBeGreaterThanOrEqual(3);

    const second = await importPreviewToCms({
      tenantId: tenantA,
      actorUserId: adminA,
      preview,
      categories: ['departments', 'faqs', 'packages'],
    });
    expect(second.totals.created).toBe(0);
    expect(second.totals.updated).toBeGreaterThanOrEqual(3);

    const deptCount = await prisma.department.count({
      where: { tenantId: tenantA, name: `${PREFIX} Cardiology` },
    });
    expect(deptCount).toBe(1);

    const leaked = await prisma.department.findFirst({
      where: { tenantId: tenantB, name: `${PREFIX} Cardiology` },
    });
    expect(leaked).toBeNull();

    const sourceFields = Object.keys(await prisma.department.findFirstOrThrow({
      where: { tenantId: tenantA, name: `${PREFIX} Cardiology` },
    }));
    expect(sourceFields.some((field) => /^source/i.test(field))).toBe(false);

    await runWithTenantContext(ctx(tenantB, `${PREFIX}-b.example`), async () => {
      const departments = await getPublishedDepartments();
      expect(departments.some((item) => item.name === `${PREFIX} Cardiology`)).toBe(false);
    });

    await runWithTenantContext(ctx(tenantA, `${PREFIX}-a.example`), async () => {
      const departments = await getPublishedDepartments();
      expect(departments.some((item) => item.name === `${PREFIX} Cardiology`)).toBe(true);
    });
  });

  it('does not delete existing CMS rows that were not in the crawl', async () => {
    await prisma.department.create({
      data: {
        name: `${PREFIX} Manual Dept`,
        slug: `${PREFIX}-manual-dept`,
        tenantId: tenantA,
        isActive: true,
        contentStatus: ContentStatus.PUBLISHED,
      },
    });
    const preview = emptyPreview();
    preview.departments = [{ name: `${PREFIX} Neurology` }];
    await importPreviewToCms({
      tenantId: tenantA,
      actorUserId: adminA,
      preview,
      categories: ['departments'],
    });
    const manual = await prisma.department.findFirst({
      where: { tenantId: tenantA, slug: `${PREFIX}-manual-dept` },
    });
    expect(manual).not.toBeNull();
  });

  it('skips invalid content instead of writing empty CMS rows', async () => {
    const preview = emptyPreview();
    preview.departments = [{ name: '   ' }];
    preview.faqs = [{ name: `${PREFIX} Incomplete`, question: `${PREFIX} Incomplete`, answer: '' }];
    preview.packages = [{ name: `${PREFIX} Empty Package`, description: '' }];
    const result = await importPreviewToCms({
      tenantId: tenantA,
      actorUserId: adminA,
      preview,
      categories: ['departments', 'faqs'],
    });
    expect(result.totals.skipped).toBeGreaterThanOrEqual(2);
    const emptyDept = await prisma.department.findFirst({ where: { tenantId: tenantA, name: '   ' } });
    expect(emptyDept).toBeNull();
  });

  it('skips competitor hospital copy instead of publishing it', async () => {
    const preview = emptyPreview();
    preview.specialities = [
      {
        name: 'Angioedema Clinic | Specialized Swelling Disorder Care – Manipal Hospitals India',
        description: 'English Angioedema Clinic at Manipal Hospitals India.',
      },
    ];
    const result = await importPreviewToCms({
      tenantId: tenantA,
      actorUserId: adminA,
      preview,
      categories: ['specialities'],
    });
    expect(result.totals.skipped).toBeGreaterThanOrEqual(1);
    const imported = await prisma.speciality.findFirst({
      where: { tenantId: tenantA, name: { contains: 'Manipal' } },
    });
    expect(imported).toBeNull();
  });
});
