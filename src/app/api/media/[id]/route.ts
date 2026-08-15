import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { requireTenantContext, requireTenantUser } from '@/server/tenant';
import { DomainError } from '@/server/errors/domain-error';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenantContext();
    const { id } = await context.params;

    const asset = await prisma.mediaAsset.findFirst({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
    }

    if (asset.isPrivate) {
      await requireTenantUser();
    }

    return NextResponse.json({
      id: asset.id,
      url: asset.url,
      altText: asset.altText,
      mimeType: asset.mimeType,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }
    return NextResponse.json({ error: 'Failed to load media.' }, { status: 500 });
  }
}
