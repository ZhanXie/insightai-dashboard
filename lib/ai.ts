import "@/lib/env"; // Validate env vars first
import { createOpenAI } from "@ai-sdk/openai";
import {
  OPENAI_COMPATIBLE_BASE_URL,
  OPENAI_COMPATIBLE_API_KEY,
  OPENAI_CHAT_MODEL,
  OPENAI_EMBEDDING_MODEL,
} from "@/lib/env";

// OpenAI-compatible API provider
const aiProvider = createOpenAI({
  baseURL: OPENAI_COMPATIBLE_BASE_URL,
  apiKey: OPENAI_COMPATIBLE_API_KEY,
});

// Chat model
export const chatModel = aiProvider(OPENAI_CHAT_MODEL);

// Embedding model
export const embeddingModel = aiProvider.embedding(OPENAI_EMBEDDING_MODEL);
