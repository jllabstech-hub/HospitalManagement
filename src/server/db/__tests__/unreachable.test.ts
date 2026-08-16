import { describe, expect, it } from 'vitest';
import { isDatabaseUnreachable } from '../unreachable';

describe('isDatabaseUnreachable', () => {
  it('detects Prisma initialization / P1001 failures', () => {
    expect(
      isDatabaseUnreachable({
        name: 'PrismaClientInitializationError',
        message: "Can't reach database server at example:5432",
      })
    ).toBe(true);
    expect(isDatabaseUnreachable({ code: 'P1001' })).toBe(true);
    expect(isDatabaseUnreachable(new Error('validation'))).toBe(false);
  });
});
