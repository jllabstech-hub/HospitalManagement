import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Permitted MIME types and maximum file size (5MB)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    // 1. Enforce strict Admin server authentication guard
    await requireAdmin();

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('altText') as string | null) ?? '';
    const caption = (formData.get('caption') as string | null) ?? '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    // 3. Security Validations
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: JPG, PNG, WebP, SVG.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5MB.' },
        { status: 400 }
      );
    }

    // Sanitize filename and build unique storage key
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginalName) || '.jpg';
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Save file to disk storage abstraction (/public/uploads)
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    // 5. Create authoritative MediaAsset database record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        url: publicUrl,
        altText: altText.trim() || sanitizedOriginalName,
        caption: caption.trim() || null,
        type: 'IMAGE',
        width: 800,
        height: 600,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json({
      success: true,
      media: mediaAsset,
    });
  } catch (error) {
    console.error('Error in Admin media upload API:', error);
    return NextResponse.json({ error: 'Failed to process media upload.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const mediaAssets = await prisma.mediaAsset.findMany({
      where: search
        ? {
            OR: [
              { url: { contains: search, mode: 'insensitive' } },
              { altText: { contains: search, mode: 'insensitive' } },
              { caption: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ media: mediaAssets });
  } catch (error) {
    console.error('Error fetching admin media assets:', error);
    return NextResponse.json({ error: 'Failed to fetch media assets.' }, { status: 500 });
  }
}
