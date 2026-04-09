import { createOpenAI } from "@ai-sdk/openai";

// Tencent Hunyuan via OpenAI-compatible API
const hunyuanProvider = createOpenAI({
  baseURL: "https://api.hunyuan.cloud.tencent.com/v1",
  apiKey: process.env.HUNYUAN_API_KEY,
});

// Chat model
export const chatModel = hunyuanProvider("hunyuan-lite");

// Embedding model (separate from chat model)
export const embeddingModel = hunyuanProvider.embedding("hunyuan-embedding");
