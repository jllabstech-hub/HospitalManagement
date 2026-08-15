import { PrismaClient } from '@prisma/client';
import { assertDatabaseIsolation } from './database-guard';

assertDatabaseIsolation();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

const EXCLUDED_MODELS = ['HospitalProfile'];

export const prisma = process.env.NODE_ENV === 'test' 
  ? basePrisma.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }) {
            const data = args.data as Record<string, unknown>;
            if (!EXCLUDED_MODELS.includes(model as string) && !data.tenantId) {
              const testTenant = await basePrisma.hospitalProfile.findFirst({ orderBy: { createdAt: 'asc' } });
              if (testTenant) {
                data.tenantId = testTenant.id;
              }
            }
            return query(args);
          },
          async createMany({ model, args, query }) {
            if (!EXCLUDED_MODELS.includes(model as string)) {
              const testTenant = await basePrisma.hospitalProfile.findFirst({ orderBy: { createdAt: 'asc' } });
              if (testTenant) {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map(d => {
                    const record = d as Record<string, unknown>;
                    return { ...record, tenantId: record.tenantId || testTenant.id };
                  }) as unknown as typeof args.data;
                } else {
                  const data = args.data as Record<string, unknown>;
                  if (!data.tenantId) {
                    data.tenantId = testTenant.id;
                  }
                }
              }
            }
            return query(args);
          }
        }
      }
    }) as unknown as PrismaClient
  : basePrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
