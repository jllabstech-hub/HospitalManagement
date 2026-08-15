import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/db/client';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'appointment.create'
  | 'appointment.cancel'
  | 'appointment.confirm'
  | 'appointment.complete'
  | 'appointment.no_show'
  | 'doctor.activate'
  | 'doctor.deactivate'
  | 'availability.change'
  | 'patient.profile.update'
  | 'cms.mutate'
  | 'media.upload'
  | 'media.delete'
  | 'enquiry.update';

export async function writeAuditLog(input: {
  tenantId: string;
  actorUserId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  correlationId?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: input.tenantId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
        correlationId: input.correlationId ?? null,
      },
    });
  } catch {
    logger.error({ event: 'audit.write_failed', tenantId: input.tenantId }, 'Failed to persist audit log');
  }
}
