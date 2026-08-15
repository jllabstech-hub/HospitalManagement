import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { DomainError } from '@/server/errors/domain-error';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8000;

const ALLOWED = {
  jpeg: { mime: 'image/jpeg', ext: ['.jpg', '.jpeg'] },
  png: { mime: 'image/png', ext: ['.png'] },
  webp: { mime: 'image/webp', ext: ['.webp'] },
} as const;

export interface ValidatedUpload {
  mimeType: string;
  extension: string;
  filename: string;
  width: number | null;
  height: number | null;
}

function sniffImageType(buffer: Buffer): 'jpeg' | 'png' | 'webp' | 'svg' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  const head = buffer.subarray(0, 256).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<!doctype svg')) {
    return 'svg';
  }
  return null;
}

function readPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function validateImageUpload(input: {
  originalName: string;
  declaredMime: string;
  size: number;
  buffer: Buffer;
}): ValidatedUpload {
  if (input.size > MAX_UPLOAD_BYTES || input.buffer.length > MAX_UPLOAD_BYTES) {
    throw new DomainError('VALIDATION_ERROR', 'File size exceeds maximum limit of 5MB.');
  }

  const declaredExt = path.extname(input.originalName || '').toLowerCase();
  const sniffed = sniffImageType(input.buffer);

  if (!sniffed) {
    throw new DomainError('VALIDATION_ERROR', 'Invalid file format. Allowed formats: JPG, PNG, WebP.');
  }
  if (sniffed === 'svg') {
    throw new DomainError('VALIDATION_ERROR', 'SVG uploads are not allowed.');
  }

  const spec = ALLOWED[sniffed];
  const declaredMime = (input.declaredMime || '').toLowerCase();
  const mimeOk =
    declaredMime === spec.mime ||
    (sniffed === 'jpeg' && (declaredMime === 'image/jpg' || declaredMime === 'image/pjpeg')) ||
    declaredMime === '';
  if (!mimeOk) {
    throw new DomainError('VALIDATION_ERROR', 'File MIME type does not match the file contents.');
  }
  const allowedExt: readonly string[] = spec.ext;
  if (declaredExt && !allowedExt.includes(declaredExt)) {
    throw new DomainError('VALIDATION_ERROR', 'File extension does not match the file contents.');
  }

  let width: number | null = null;
  let height: number | null = null;
  if (sniffed === 'png') {
    const size = readPngSize(input.buffer);
    if (size) {
      width = size.width;
      height = size.height;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width < 1 || height < 1) {
        throw new DomainError('VALIDATION_ERROR', 'Image dimensions are not allowed.');
      }
    }
  }

  const extension = spec.ext[0];
  const filename = `${randomBytes(16).toString('hex')}${extension}`;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new DomainError('VALIDATION_ERROR', 'Invalid generated filename.');
  }

  return {
    mimeType: spec.mime,
    extension,
    filename,
    width,
    height,
  };
}

export function contentAddressedName(buffer: Buffer, extension: string): string {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 32);
  return `${hash}${extension}`;
}
