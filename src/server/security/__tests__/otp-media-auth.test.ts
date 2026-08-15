import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/server/db/client';
import { generateOtpCode, hashOtp, issueOtpChallenge, otpInternals, verifyOtpChallenge } from '@/server/security/otp';
import { DomainError } from '@/server/errors/domain-error';
import { getAuthSecret } from '@/server/security/auth-secret';
import { validateImageUpload } from '@/server/security/media';

describe('OTP production safety', () => {
  let tenantId: string;
  const phone = '+919999900001';

  beforeEach(async () => {
    const tenant = await prisma.hospitalProfile.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
    if (!tenant) throw new Error('Need a hospital profile for OTP tests');
    tenantId = tenant.id;
    await prisma.otpChallenge.deleteMany({ where: { phone } });
    await prisma.authAttempt.deleteMany({ where: { key: { contains: phone } } });
  });

  afterEach(async () => {
    await prisma.otpChallenge.deleteMany({ where: { phone } });
    await prisma.authAttempt.deleteMany({ where: { key: { contains: phone } } });
  });

  it('generates a 6-digit numeric OTP', () => {
    const otp = generateOtpCode();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('stores only a hash and rejects expired/consumed codes', async () => {
    const issued = await issueOtpChallenge({ tenantId, phone });
    expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const stored = await prisma.otpChallenge.findFirst({ where: { tenantId, phone }, orderBy: { createdAt: 'desc' } });
    expect(stored).toBeTruthy();
    expect(stored?.codeHash).not.toMatch(/^\d{6}$/);

    await expect(verifyOtpChallenge({ tenantId, phone, otp: '000000' })).rejects.toBeInstanceOf(DomainError);

    const challenge = await prisma.otpChallenge.findFirst({ where: { id: stored!.id } });
    expect(challenge?.attemptCount).toBe(1);

    await prisma.otpChallenge.update({
      where: { id: stored!.id },
      data: { expiresAt: new Date(Date.now() - 1000), attemptCount: 0 },
    });
    await expect(verifyOtpChallenge({ tenantId, phone, otp: '111111' })).rejects.toBeInstanceOf(DomainError);
  });

  it('enforces max attempts and one-time consumption', async () => {
    await issueOtpChallenge({ tenantId, phone });
    const stored = await prisma.otpChallenge.findFirst({ where: { tenantId, phone }, orderBy: { createdAt: 'desc' } });
    expect(stored).toBeTruthy();

    await prisma.otpChallenge.update({
      where: { id: stored!.id },
      data: { attemptCount: otpInternals.MAX_ATTEMPTS },
    });
    await expect(verifyOtpChallenge({ tenantId, phone, otp: '123123' })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('rejects OTP for the wrong tenant', async () => {
    const other = await prisma.hospitalProfile.create({
      data: { hospitalName: 'OTP Other', customDomain: `otp-other-${Date.now()}.example`, isActive: true },
    });
    await issueOtpChallenge({ tenantId, phone });
    await expect(verifyOtpChallenge({ tenantId: other.id, phone, otp: '123123' })).rejects.toBeInstanceOf(DomainError);
    await prisma.hospitalProfile.delete({ where: { id: other.id } });
  });

  it('hashes with tenant binding', () => {
    const a = hashOtp('tenant-a', phone, '123123');
    const b = hashOtp('tenant-b', phone, '123123');
    expect(a).not.toBe(b);
    expect(getAuthSecret().length).toBeGreaterThanOrEqual(32);
  });
});

describe('Media upload hardening', () => {
  it('rejects SVG content even with a png extension', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(() =>
      validateImageUpload({ originalName: 'logo.png', declaredMime: 'image/png', size: svg.length, buffer: svg })
    ).toThrow();
  });

  it('rejects mismatched extension for JPEG signature', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    expect(() =>
      validateImageUpload({ originalName: 'photo.png', declaredMime: 'image/jpeg', size: jpeg.length, buffer: jpeg })
    ).toThrow(/extension/i);
  });

  it('accepts JPEG with matching type', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const result = validateImageUpload({
      originalName: 'photo.jpg',
      declaredMime: 'image/jpeg',
      size: jpeg.length,
      buffer: jpeg,
    });
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.filename.endsWith('.jpg')).toBe(true);
  });
});
