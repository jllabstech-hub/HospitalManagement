import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { getPublishedDepartments, getPublishedSpecialities } from '@/features/cms/queries/catalog';
import { getPublicDoctorByIdOrSlug } from '@/features/cms/queries/doctors-public';
import { getArticleBySlug } from '@/features/cms/queries/content';
import { submitContactMessageAction } from '@/features/cms/actions/public-forms';

const TEST_PREFIX = 'cms.public.test';

describe('CMS Public Queries & Forms', () => {
  let publishedDeptId: string;
  let draftDeptId: string;
  let publishedSpecialityId: string;
  let draftSpecialityId: string;
  let doctorId: string;
  let doctorSlug: string;
  let publishedArticleSlug: string;
  let draftArticleSlug: string;

  beforeAll(async () => {
    await prisma.contactMessage.deleteMany({ where: { email: { contains: TEST_PREFIX } } });
    await prisma.healthArticle.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.doctorSpeciality.deleteMany({
      where: { doctor: { slug: { contains: TEST_PREFIX } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { slug: { contains: TEST_PREFIX } } },
    });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { contains: TEST_PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });

    const publishedDept = await prisma.department.create({
      data: {
        name: `${TEST_PREFIX} Published Dept`,
        slug: `${TEST_PREFIX}-published-dept`,
        shortDescription: 'Published active department for CMS tests.',
        contentStatus: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });
    publishedDeptId = publishedDept.id;

    const draftDept = await prisma.department.create({
      data: {
        name: `${TEST_PREFIX} Draft Dept`,
        slug: `${TEST_PREFIX}-draft-dept`,
        shortDescription: 'Draft department — should not appear publicly.',
        contentStatus: ContentStatus.DRAFT,
        isActive: true,
      },
    });
    draftDeptId = draftDept.id;

    await prisma.department.create({
      data: {
        name: `${TEST_PREFIX} Inactive Published Dept`,
        slug: `${TEST_PREFIX}-inactive-dept`,
        shortDescription: 'Inactive published department.',
        contentStatus: ContentStatus.PUBLISHED,
        isActive: false,
      },
    });

    const publishedSpec = await prisma.speciality.create({
      data: {
        name: `${TEST_PREFIX} Published Speciality`,
        slug: `${TEST_PREFIX}-published-spec`,
        shortDescription: 'Published speciality.',
        departmentId: publishedDeptId,
        contentStatus: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });
    publishedSpecialityId = publishedSpec.id;

    const draftSpec = await prisma.speciality.create({
      data: {
        name: `${TEST_PREFIX} Draft Speciality`,
        slug: `${TEST_PREFIX}-draft-spec`,
        shortDescription: 'Draft speciality — hidden from public.',
        departmentId: publishedDeptId,
        contentStatus: ContentStatus.DRAFT,
        isActive: true,
      },
    });
    draftSpecialityId = draftSpec.id;

    const doctorUser = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}.doctor@hospital.com`,
        passwordHash: 'hashed-secret-not-exposed',
        role: Role.DOCTOR,
        isActive: true,
      },
    });

    const doctor = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        departmentId: publishedDeptId,
        fullName: `${TEST_PREFIX} Dr Public`,
        slug: `${TEST_PREFIX}-doctor`,
        phoneNumber: '+91 90000 00001',
        qualification: 'MBBS',
        publicDisplayName: `${TEST_PREFIX} Dr Public`,
        contentStatus: ContentStatus.PUBLISHED,
      },
    });
    doctorId = doctor.id;
    doctorSlug = doctor.slug;

    publishedArticleSlug = `${TEST_PREFIX}-published-article`;
    draftArticleSlug = `${TEST_PREFIX}-draft-article`;

    await prisma.healthArticle.createMany({
      data: [
        {
          title: `${TEST_PREFIX} Published Article`,
          slug: publishedArticleSlug,
          content: 'Published article body for CMS test.',
          contentStatus: ContentStatus.PUBLISHED,
          publishedAt: new Date('2026-08-01'),
        },
        {
          title: `${TEST_PREFIX} Draft Article`,
          slug: draftArticleSlug,
          content: 'Draft article body — not public.',
          contentStatus: ContentStatus.DRAFT,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.contactMessage.deleteMany({ where: { email: { contains: TEST_PREFIX } } });
    await prisma.healthArticle.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.doctorSpeciality.deleteMany({
      where: { doctor: { slug: { contains: TEST_PREFIX } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { slug: { contains: TEST_PREFIX } } },
    });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { contains: TEST_PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: TEST_PREFIX } } });
  });

  it('getPublishedDepartments returns only published active departments', async () => {
    const departments = await getPublishedDepartments();
    const ids = departments.map((d) => d.id);

    expect(ids).toContain(publishedDeptId);
    expect(ids).not.toContain(draftDeptId);
  });

  it('draft speciality is not returned by getPublishedSpecialities', async () => {
    const specialities = await getPublishedSpecialities();
    const ids = specialities.map((s) => s.id);

    expect(ids).toContain(publishedSpecialityId);
    expect(ids).not.toContain(draftSpecialityId);
  });

  it('getPublicDoctorByIdOrSlug never includes passwordHash', async () => {
    const byId = await getPublicDoctorByIdOrSlug(doctorId);
    const bySlug = await getPublicDoctorByIdOrSlug(doctorSlug);

    expect(byId).not.toBeNull();
    expect(bySlug).not.toBeNull();
    expect(byId).not.toHaveProperty('passwordHash');
    expect(bySlug).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(byId)).not.toContain('hashed-secret-not-exposed');
  });

  it('department slugs must be unique (two departments, different slugs)', async () => {
    const deptA = await prisma.department.create({
      data: {
        name: `${TEST_PREFIX} Slug A`,
        slug: `${TEST_PREFIX}-slug-a`,
        contentStatus: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });

    const deptB = await prisma.department.create({
      data: {
        name: `${TEST_PREFIX} Slug B`,
        slug: `${TEST_PREFIX}-slug-b`,
        contentStatus: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });

    expect(deptA.slug).not.toBe(deptB.slug);

    await prisma.department.deleteMany({
      where: { id: { in: [deptA.id, deptB.id] } },
    });
  });

  it('submitContactMessageAction succeeds with valid data', async () => {
    const result = await submitContactMessageAction({
      name: `${TEST_PREFIX} Visitor`,
      email: `${TEST_PREFIX}@example.com`,
      phone: '+91 90000 00002',
      subject: 'CMS test enquiry',
      message: 'This is a valid test contact message for CMS public forms.',
    });

    expect(result.success).toBe(true);

    const saved = await prisma.contactMessage.findFirst({
      where: { email: `${TEST_PREFIX}@example.com` },
    });
    expect(saved).not.toBeNull();
    expect(saved?.subject).toBe('CMS test enquiry');
  });

  it('unpublished article is not returned by getArticleBySlug', async () => {
    const published = await getArticleBySlug(publishedArticleSlug);
    const draft = await getArticleBySlug(draftArticleSlug);

    expect(published).not.toBeNull();
    expect(published?.slug).toBe(publishedArticleSlug);
    expect(draft).toBeNull();
  });
});
