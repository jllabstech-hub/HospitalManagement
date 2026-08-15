import { Prisma } from '@prisma/client';
import { DomainError } from '@/server/errors/domain-error';

export function prismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

export async function updateOwnedOrThrow(
  result: Promise<Prisma.BatchPayload>
): Promise<void> {
  const payload = await result;
  if (payload.count !== 1) {
    throw new DomainError('NOT_FOUND', 'Record not found.', undefined, 404);
  }
}

export async function deleteOwnedOrThrow(
  result: Promise<Prisma.BatchPayload>
): Promise<void> {
  const payload = await result;
  if (payload.count !== 1) {
    throw new DomainError('NOT_FOUND', 'Record not found.', undefined, 404);
  }
}

export async function assertSameTenant(
  tenantId: string,
  entity: { tenantId: string } | null,
  message = 'Referenced record was not found.'
): Promise<void> {
  if (!entity || entity.tenantId !== tenantId) {
    throw new DomainError('NOT_FOUND', message, undefined, 404);
  }
}
