import crypto from "crypto";
import qiniu from "qiniu";
import {
  QINIU_ACCESS_KEY,
  QINIU_SECRET_KEY,
  QINIU_BUCKET,
  QINIU_DOMAIN,
  QINIU_UPLOAD_URL,
} from "@/lib/env";
import type { StorageProvider, UploadResult } from "./types";

function assertConfigured(): void {
  if (!QINIU_ACCESS_KEY || !QINIU_SECRET_KEY || !QINIU_BUCKET || !QINIU_DOMAIN) {
    throw new Error(
      "Qiniu storage is not configured. Set QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET, and QINIU_DOMAIN env vars."
    );
  }
}

function getConfig() {
  assertConfigured();
  return {
    accessKey: QINIU_ACCESS_KEY,
    secretKey: QINIU_SECRET_KEY,
    bucket: QINIU_BUCKET,
    domain: QINIU_DOMAIN.replace(/\/$/, ""),
  };
}

function createMac(): qiniu.auth.digest.Mac {
  const config = getConfig();
  return new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
}

export class QiniuStorageProvider implements StorageProvider {
  readonly name = "qiniu";

  async uploadFile(buffer: Buffer, key: string, _mimeType: string): Promise<UploadResult> {
    void _mimeType;
    const uploadToken = await this.generateUploadToken(key);

    // Build multipart form-data manually
    const boundary = `----FormBoundary${crypto.randomUUID()}`;
    const encoder = new TextEncoder();

    // Helper to create a multipart part
    const part = (name: string, value: string | Buffer, filename?: string) => {
      let header = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="${name}"`;
      if (filename) {
        header += `; filename="${filename}"`;
      }
      header += "\r\n\r\n";
      const headerBuf = encoder.encode(header);
      const valueBuf = typeof value === "string" ? encoder.encode(value) : value;
      return Buffer.concat([headerBuf, valueBuf]);
    };

    const bodyParts = [
      part("token", uploadToken),
      part("key", key),
      part("file", buffer, key),
      encoder.encode(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(bodyParts);

    const response = await fetch(QINIU_UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qiniu upload failed (${response.status}): ${errText}`);
    }

    const result = (await response.json()) as { key?: string; hash?: string };
    if (!result.key) {
      throw new Error(`Qiniu upload failed: unexpected response ${JSON.stringify(result)}`);
    }

    return { key, url: this.getPublicUrl(key) };
  }

  async generateUploadToken(key: string): Promise<string> {
    const config = getConfig();
    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);

    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${config.bucket}:${key}`,
      expires: 3600,
    });

    return putPolicy.uploadToken(mac);
  }

  async deleteFile(key: string): Promise<void> {
    const config = getConfig();
    const mac = createMac();
    const bucketManager = new qiniu.rs.BucketManager(mac, new qiniu.conf.Config());

    return new Promise((resolve, reject) => {
      bucketManager.delete(config.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        // 200 = success, 612 = already deleted (idempotent)
        if (respInfo.statusCode === 200 || respInfo.statusCode === 612) {
          resolve();
        } else {
          reject(
            new Error(
              `Qiniu delete failed (${respInfo.statusCode}): ${JSON.stringify(respBody)}`
            )
          );
        }
      });
    });
  }

  getPublicUrl(key: string): string {
    let domain = QINIU_DOMAIN.replace(/\/$/, "");
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = `http://${domain}`;
    }
    const baseUrl = `${domain}/${key}`;

    // Generate a signed URL for private bucket access (expires in 28800s = 8 hours)
    return this._signUrl(baseUrl, 28800);
  }

  /** Generate a signed download URL with expiration */
  private _signUrl(baseUrl: string, expiresSeconds: number): string {
    const config = getConfig();
    const deadline = Math.floor(Date.now() / 1000) + expiresSeconds;

    // Build the unsigned URL with expiration parameter
    const urlToSign = `${baseUrl}?e=${deadline}`;

    // Sign using HMAC-SHA1 with secret key
    const signature = crypto
      .createHmac("sha1", Buffer.from(config.secretKey))
      .update(Buffer.from(urlToSign))
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const safeSignature = encodeURIComponent(signature);

    return `${urlToSign}&token=${config.accessKey}:${safeSignature}`;
  }

  async getDownloadUrl(key: string, filename: string): Promise<string> {
    const publicUrl = this.getPublicUrl(key);
    const encodedFilename = encodeURIComponent(filename);
    return `${publicUrl}?attname=${encodedFilename}`;
  }
}