import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function GET() {
  try {
    // 1. Perform database readiness ping
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        service: 'Hospital Appointment Management System API',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check database ping failed:', error);

    // 2. Safe degraded response without leaking secrets or connection strings
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        service: 'Hospital Appointment Management System API',
      },
      { status: 503 }
    );
  }
}
