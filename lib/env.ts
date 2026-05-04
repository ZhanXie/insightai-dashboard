// Environment variable validation
// Throws on startup if required vars are missing or invalid

function assertEnv(
  name: string,
  condition?: boolean,
  message?: string
): string {
  if (typeof window !== 'undefined') return '';
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  if (condition !== undefined && !condition) {
    throw new Error(message || `Invalid environment variable: ${name}`);
  }
  
  return value;
}

// Required environment variables
export const DATABASE_URL = assertEnv("DATABASE_URL");
export const OPENAI_COMPATIBLE_BASE_URL = assertEnv("OPENAI_COMPATIBLE_BASE_URL");
export const OPENAI_COMPATIBLE_API_KEY = assertEnv("OPENAI_COMPATIBLE_API_KEY");
export const AUTH_SECRET = assertEnv("AUTH_SECRET", 
  (process.env.AUTH_SECRET?.length || 0)>= 16, 
  "AUTH_SECRET must be at least 16 characters"
);

// Optional environment variables with defaults
export const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL || DATABASE_URL;
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "qwen3.6-plus-2026-04-02";
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-v4";
export const OPENAI_ASR_MODEL = process.env.OPENAI_ASR_MODEL || "paraformer-v2";
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Storage provider for video transcripts (optional — only needed when video feature is used)
export const VIDEO_STORAGE_PROVIDER = process.env.VIDEO_STORAGE_PROVIDER || "";
export const QINIU_ACCESS_KEY = process.env.QINIU_ACCESS_KEY || "";
export const QINIU_SECRET_KEY = process.env.QINIU_SECRET_KEY || "";
export const QINIU_BUCKET = process.env.QINIU_BUCKET || "";
export const QINIU_DOMAIN = process.env.QINIU_DOMAIN || "";
export const QINIU_UPLOAD_URL = process.env.QINIU_UPLOAD_URL || "https://up-z0.qiniup.com";

// App environment for storage path prefix (development | staging | production)
export const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";