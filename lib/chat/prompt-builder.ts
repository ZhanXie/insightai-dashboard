// Prompt builder service
// Constructs system prompts and AI message arrays for chat API

import { hybridSearch, searchRelevantChunks, SearchOptions } from "@/lib/vector-search";
import { prisma } from "@/lib/prisma";
import { embeddingModel } from "@/lib/ai";
import { embed } from "ai";

/**
 * Options for building system prompt
 */
export interface PromptBuilderOptions {
  /** Scope search to specific document IDs only */
  documentIds?: string[];
  /** Enable hybrid search (BM25 + vector) */
  useHybridSearch?: boolean;
  /** Enable query rewriting using conversation history */
  useQueryRewrite?: boolean;
  /** Previous messages for query rewriting */
  previousMessages?: Array<{ role: string; content: string }>;
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
 * Rewrite query using conversation history
 * Expands short queries with context from previous messages
 */
function rewriteQueryWithHistory(
  currentQuery: string,
  previousMessages: Array<{ role: string; content: string }>
): string {
  if (!previousMessages || previousMessages.length === 0) {
    return currentQuery;
  }

  // Extract recent user messages (last 3)
  const recentUserMessages = previousMessages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content);

  if (recentUserMessages.length === 0) {
    return currentQuery;
  }

  const historyContext = recentUserMessages.join(" | ");

  // Check if the current query is short or vague
  if (currentQuery.length < 20 || /^(这|那|它|这个|那个|请问|帮我)/.test(currentQuery)) {
    return `${currentQuery} (Context from conversation: ${historyContext})`;
  }

  return currentQuery;
}

/**
 * Build structured context from retrieved chunks
 * Includes document summaries and better formatted citations
 */
function buildContextSection(
  chunks: Array<{
    id: string;
    content: string;
    position: number;
    documentFilename: string;
    heading?: string;
  }>,
  documentInfos: DocumentInfo[]
): string {
  if (chunks.length === 0) {
    return "";
  }

  // Group chunks by document for better organization
  const chunksByDoc = new Map<string, typeof chunks>();
  for (const chunk of chunks) {
    const existing = chunksByDoc.get(chunk.documentFilename) || [];
    existing.push(chunk);
    chunksByDoc.set(chunk.documentFilename, existing);
  }

  const contextParts: string[] = [];

  // Add document summary header
  const docNames = Array.from(chunksByDoc.keys());
  if (docNames.length > 1) {
    contextParts.push(`📚 Referenced Documents: ${docNames.join(", ")}`);
    contextParts.push("");
  }

  // Build structured context with clear citations
  for (const [filename, docChunks] of chunksByDoc) {
    const docInfo = documentInfos.find((d) => d.filename === filename);
    const chunkCount = docInfo?.chunkCount || docChunks.length;

    contextParts.push(`## 📄 ${filename}`);
    contextParts.push(`(Total chunks: ${chunkCount})`);
    contextParts.push("");

    for (const chunk of docChunks) {
      // Include section heading if available
      const headingPrefix = chunk.heading ? `[${chunk.heading}] ` : "";
      const citation = `[${filename}#${chunk.position + 1}]`;

      contextParts.push(`${headingPrefix}${citation} ${chunk.content}`);
      contextParts.push("");
    }
  }

  return contextParts.join("\n");
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
    useQueryRewrite = true,
    previousMessages = [],
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

  let systemPrompt = `You are a helpful AI assistant for an intelligent dashboard. You help users answer questions based on their uploaded documents.`;

  // Add instruction for citing sources
  systemPrompt += `\n\nWhen answering based on documents, always cite your sources using the format [filename#chunk_number] at the end of relevant statements.`;

  if (docCount > 0) {
    // Rewrite query with conversation history if enabled
    const effectiveQuery = useQueryRewrite
      ? rewriteQueryWithHistory(query, previousMessages)
      : query;

    // Generate embedding for the query
    const { embedding } = await embed({
      model: embeddingModel,
      value: effectiveQuery,
    });

    // Search options
    const searchOptions: SearchOptions = {
      documentIds,
      useMMR: true,
      mmrLambda: 0.5,
    };

    // Execute search (hybrid or vector)
    const contextChunks = useHybridSearch
      ? await hybridSearch(userId, embedding, effectiveQuery, searchOptions)
      : await searchRelevantChunks(userId, embedding, searchOptions);

    // Get document info for context
    const documentInfos = await getDocumentInfo(userId, documentIds);

    if (contextChunks.length > 0) {
      const contextText = buildContextSection(contextChunks, documentInfos);

      systemPrompt += `\n\n## Relevant Document Content\n\n${contextText}`;
      systemPrompt += `\n\nInstructions:\n- Answer based on the document excerpts above when relevant\n- If the answer can be found in the documents, cite your sources using [filename#chunk_number]\n- If the documents don't contain enough information, say so clearly\n- Do not make up information that isn't in the documents`;
    } else {
      systemPrompt += `\n\nNo relevant document excerpts were found for this query. The search was performed${documentIds && documentIds.length > 0 ? " in the selected documents" : ""}. If you can answer from general knowledge, do so. Otherwise, inform the user that the documents don't contain relevant information.`;
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
