import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('Password Hashing Utility', () => {
  it('should hash a password and verify it successfully', async () => {
    const password = 'SecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'SecretPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should throw an error for passwords shorter than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
  });
});
