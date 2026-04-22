import { createOpenAI } from "@ai-sdk/openai";

// OpenAI-compatible API provider
const aiProvider = createOpenAI({
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
});

// Chat model
export const chatModel = aiProvider(process.env.OPENAI_CHAT_MODEL || "qwen3.6-plus-2026-04-02");

// Embedding model (separate from chat model)
export const embeddingModel = aiProvider.embedding(
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-v4"
);
