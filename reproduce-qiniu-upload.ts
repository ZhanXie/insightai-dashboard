import { QiniuStorageProvider } from "./lib/storage/qiniu";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function testUpload() {
  const provider = new QiniuStorageProvider();
  const buffer = Buffer.from("test content " + Date.now());
  const key = `test-upload-${Date.now()}.txt`;
  
  console.log(`Testing upload with key: ${key}`);
  try {
    const result = await provider.uploadFile(buffer, key, "text/plain");
    console.log("Upload successful:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

testUpload();
