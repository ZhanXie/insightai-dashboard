// Prompt builder service
// Constructs system prompts and AI message arrays for chat API

import { hybridSearch, searchRelevantChunks, SearchOptions, SearchResultChunk } from "@/lib/vector-search";
import { prisma } from "@/lib/prisma";
import { embeddingModel, chatModel } from "@/lib/ai";
import { embed, generateText } from "ai";

/**
 * Options for building system prompt
 */
export interface PromptBuilderOptions {
  /** Scope search to specific document IDs only */
  documentIds?: string[];
  /** Enable hybrid search (BM25 + vector) */
  useHybridSearch?: boolean;
  /** Enable query rewriting using LLM */
  useQueryRewrite?: boolean;
  /** Previous messages for query rewriting */
  previousMessages?: Array<{ role: string; content: string }>;
  /** Minimum relevance score threshold (0-1) */
  minRelevanceScore?: number;
}

/**
 * Document info for context
 */
interface DocumentInfo {
  id: string;
  filename: string;
  chunkCount: number;
}

/**
 * Get document info for given IDs or all user documents
 */
async function getDocumentInfo(
  userId: string,
  documentIds?: string[]
): Promise<DocumentInfo[]> {
  const docs = await prisma.document.findMany({
    where: {
      userId,
      status: "ready",
      ...(documentIds && documentIds.length > 0
        ? { id: { in: documentIds } }
        : {}),
    },
    select: {
      id: true,
      filename: true,
      chunkCount: true,
    },
  });
  return docs;
}

/**
 * Rewrite query using LLM for better retrieval
 * Rewrites short/vague queries with conversation context
 */
async function rewriteQueryWithLLM(
  currentQuery: string,
  previousMessages: Array<{ role: string; content: string }>,
  _userId: string
): Promise<string> {
  if (!previousMessages || previousMessages.length === 0) {
    return currentQuery;
  }

  // Extract recent conversation context
  const recentMessages = previousMessages.slice(-6); // Last 3 turns
  const conversationHistory = recentMessages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  // Check if query needs rewriting
  const needsRewrite =
    currentQuery.length < 15 ||
    /^(这|那|它|这个|那个|请问|帮我|请|能不能)/.test(currentQuery) ||
    /^(what|this|that|it|can|please|help)/i.test(currentQuery);

  if (!needsRewrite) {
    return currentQuery;
  }

  // Use LLM to rewrite the query
  const rewritePrompt = `You are a query rewriting assistant for a document Q&A system.

Recent conversation:
${conversationHistory}

Current user query: "${currentQuery}"

Rewrite the user's query to be more specific and self-contained for document retrieval.
- If the query refers to something from context (like "it", "that document"), include the relevant details
- Expand abbreviations and pronouns
- Make implicit information explicit
- Keep it concise but complete

Return ONLY the rewritten query, nothing else.`;

  try {
    const result = await generateText({
      model: chatModel,
      messages: [{ role: "user", content: rewritePrompt }],
      maxTokens: 200,
    });

    const rewritten = result.text.trim();

    // Validate the rewrite is reasonable
    if (rewritten.length > 5 && rewritten.length < 500) {
      return rewritten;
    }
  } catch (error) {
    console.error("Query rewrite failed, using original:", error);
  }

  // Fallback: simple concatenation
  const historyContext = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" | ");

  return `${currentQuery} (Context: ${historyContext})`;
}

/**
 * Sort chunks by document position for better context flow
 */
function sortChunksByPosition(
  chunks: SearchResultChunk[]
): SearchResultChunk[] {
  return [...chunks].sort((a, b) => {
    // First sort by document
    if (a.documentFilename !== b.documentFilename) {
      return a.documentFilename.localeCompare(b.documentFilename);
    }
    // Then by position within document
    return a.position - b.position;
  });
}

/**
 * Filter chunks by relevance score threshold
 * Currently uses position as a proxy (earlier results are more relevant)
 */
function filterByRelevance(
  chunks: SearchResultChunk[],
  _threshold: number = 0.3
): SearchResultChunk[] {
  if (chunks.length <= 3) return chunks;

  // For hybrid search, we need to consider the combined scores
  // For now, use a simple heuristic: keep top 80% or at least 3
  const keepCount = Math.max(3, Math.floor(chunks.length * 0.8));
  return chunks.slice(0, keepCount);
}

/**
 * Build structured context from retrieved chunks
 * Includes document summaries, better formatting, and citations
 */
function buildContextSection(
  chunks: SearchResultChunk[],
  documentInfos: DocumentInfo[]
): string {
  if (chunks.length === 0) {
    return "";
  }

  // Sort chunks by document and position for better flow
  const sortedChunks = sortChunksByPosition(chunks);

  // Group chunks by document
  const chunksByDoc = new Map<string, SearchResultChunk[]>();
  for (const chunk of sortedChunks) {
    const existing = chunksByDoc.get(chunk.documentFilename) || [];
    existing.push(chunk);
    chunksByDoc.set(chunk.documentFilename, existing);
  }

  const contextParts: string[] = [];

  // Add document summary header
  const docNames = Array.from(chunksByDoc.keys());
  if (docNames.length > 1) {
    contextParts.push(`📚 Referenced Documents (${docNames.length}):`);
    contextParts.push(docNames.map((name) => `  - ${name}`).join("\n"));
    contextParts.push("");
  }

  // Build structured context with clear citations
  for (const [filename, docChunks] of chunksByDoc) {
    const docInfo = documentInfos.find((d) => d.filename === filename);
    const chunkCount = docInfo?.chunkCount || docChunks.length;

    contextParts.push(`## 📄 ${filename} (showing ${docChunks.length}/${chunkCount} relevant chunks)`);
    contextParts.push("");

    for (let i = 0; i < docChunks.length; i++) {
      const chunk = docChunks[i];
      const headingPrefix = chunk.heading ? `[${chunk.heading}] ` : "";
      const citation = `[${filename}#${chunk.position + 1}]`;

      // Add visual separator between chunks from same doc
      if (i > 0) {
        contextParts.push("---");
      }

      contextParts.push(`${headingPrefix}${citation} ${chunk.content}`);
      contextParts.push("");
    }
  }

  return contextParts.join("\n");
}

/**
 * Check if query is asking for multi-document synthesis
 */
function requiresMultiDocSynthesis(query: string): boolean {
  const synthesisPatterns = [
    /比较|对比|差异|区别/,
    /compare|difference|contrast|vs\.?/,
    /总结|summarize|汇总|综合/,
    /总结|summarize|total|overall/,
    /所有|全部|整个/,
    /all|every|entire|whole/,
    /共同点|相同/,
    /similar|common|both/,
  ];

  return synthesisPatterns.some((pattern) => pattern.test(query));
}

/**
 * Build system prompt with enhanced RAG context
 */
export async function buildSystemPrompt(
  userId: string,
  query: string,
  options: PromptBuilderOptions = {}
): Promise<string> {
  const {
    documentIds,
    useHybridSearch = true,
    useQueryRewrite = false,
    previousMessages = [],
    minRelevanceScore = 0.3,
  } = options;

  // Check if user has any ready documents in scope
  const docCount = await prisma.document.count({
    where: {
      userId,
      status: "ready",
      ...(documentIds && documentIds.length > 0
        ? { id: { in: documentIds } }
        : {}),
    },
  });

  // Base system prompt
  let systemPrompt = `You are a helpful AI assistant for an intelligent dashboard. You help users answer questions based on their uploaded documents.`;

  if (docCount > 0) {
    // Rewrite query using LLM if enabled
    const effectiveQuery = useQueryRewrite
      ? await rewriteQueryWithLLM(query, previousMessages, userId)
      : query;

    // Generate embedding for the query
    const { embedding } = await embed({
      model: embeddingModel,
      value: effectiveQuery,
    });

    // Search options - balanced for speed and accuracy
    const searchOptions: SearchOptions = {
      documentIds,
      useMMR: true,
      mmrLambda: 0.5,
      fetchK: 10, // Reduced from 15 for faster search
      topK: 8,
    };

    // Execute search (hybrid or vector)
    let contextChunks = useHybridSearch
      ? await hybridSearch(userId, embedding, effectiveQuery, searchOptions)
      : await searchRelevantChunks(userId, embedding, searchOptions);

    // Filter by relevance threshold
    contextChunks = filterByRelevance(contextChunks, minRelevanceScore);

    // Get document info for context
    const documentInfos = await getDocumentInfo(userId, documentIds);

    if (contextChunks.length > 0) {
      const contextText = buildContextSection(contextChunks, documentInfos);
      const isMultiDoc = documentInfos.length > 1 && requiresMultiDocSynthesis(query);

      systemPrompt += `\n\n## Relevant Document Content\n\n${contextText}`;

      // Enhanced instructions
      systemPrompt += `\n\n## Answer Instructions\n`;

      // Multi-document synthesis instruction
      if (isMultiDoc) {
        systemPrompt += `- This question may require information from multiple documents
- Synthesize information from all relevant sources
- Clearly indicate which document each piece of information comes from
- If documents contain conflicting information, note the conflict
`;
      }

      // General instructions
      systemPrompt += `- Answer based primarily on the document excerpts above
- Always cite your sources using [filename#chunk_number] after relevant statements
- If the documents contain partial information, use what is available and note limitations
- Only use general knowledge if the documents don't contain relevant information
- Do NOT make up information not present in the documents
- Be concise but complete - include key details from the sources`;
    } else {
      systemPrompt += `\n\nNo relevant document excerpts were found for this query. The search was performed${documentIds && documentIds.length > 0 ? " in the selected documents" : ""}. If you can answer from general knowledge, do so, but clearly state that the information is not from the documents.`;
    }
  } else {
    const scopeText = documentIds && documentIds.length > 0
      ? " in the selected documents"
      : "";
    systemPrompt += `\n\nNo documents have been uploaded${scopeText} yet. Please let the user know they need to upload documents to the knowledge base before asking document-related questions.`;
  }

  return systemPrompt;
}

/**
 * Build messages array for AI API
 */
export function buildAiMessages(
  systemPrompt: string,
  userMessages: Array<{ role: string; content: string }>
) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...userMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];
}
