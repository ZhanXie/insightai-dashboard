import type { StorageProvider } from "./types";
import { QiniuStorageProvider } from "./qiniu";
import { VIDEO_STORAGE_PROVIDER } from "@/lib/env";

let provider: StorageProvider | null = null;

/**
 * Get the configured storage provider.
 *
 * To add a new provider:
 * 1. Create `lib/storage/<name>.ts` implementing StorageProvider
 * 2. Add a case in the switch below
 * 3. Set `VIDEO_STORAGE_PROVIDER=<name>` in .env
 */
export function getStorageProvider(): StorageProvider {
  if (provider) return provider;

  const name = VIDEO_STORAGE_PROVIDER || "qiniu";

  switch (name) {
    case "qiniu":
      provider = new QiniuStorageProvider();
      break;
    default:
      throw new Error(
        `Unknown storage provider: "${name}". Available: qiniu. Set VIDEO_STORAGE_PROVIDER in .env`
      );
  }

  return provider;
}
