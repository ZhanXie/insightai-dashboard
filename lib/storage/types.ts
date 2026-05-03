// Storage provider abstraction — allows swapping between Qiniu, R2, S3, etc.
// To add a new provider, implement this interface and register it in index.ts.

export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  readonly name: string;

  /** Upload a buffer (server-side) */
  uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;

  /** Generate an upload token for client-side direct upload (returns token string) */
  generateUploadToken(key: string): Promise<string>;

  /** Delete a file by key */
  deleteFile(key: string): Promise<void>;

  /** Get the public URL for a file */
  getPublicUrl(key: string): string;

  /** Get a download URL (may include signature / content-disposition) */
  getDownloadUrl(key: string, filename: string): Promise<string>;
}
