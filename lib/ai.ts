import "@/lib/env"; // Validate env vars first
import { createOpenAI } from "@ai-sdk/openai";

// OpenAI-compatible API provider
const aiProvider = createOpenAI({
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
});

// Chat model
export const chatModel = aiProvider(process.env.OPENAI_CHAT_MODEL || "qvq-max-latest");

// Embedding model (separate from chat model)
export const embeddingModel = aiProvider.embedding(
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-v4"
);
