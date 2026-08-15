export interface UploadObjectInput {
  tenantId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  isPrivate?: boolean;
}

export interface UploadObjectResult {
  key: string;
  publicUrl: string;
}

export interface StorageProvider {
  uploadObject(input: UploadObjectInput): Promise<UploadObjectResult>;
  deleteObject(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}

export type ObjectStorageClient = {
  putObject: (input: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType: string;
    isPrivate: boolean;
  }) => Promise<void>;
  deleteObject: (input: { bucket: string; key: string }) => Promise<void>;
};
