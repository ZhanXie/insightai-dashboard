import { prisma } from "@/lib/prisma";

/**
 * Search options for vector search
 */
export interface SearchOptions {
  /** Number of results to retrieve before reranking */
  fetchK?: number;
  /** Final number of results after reranking */
  topK?: number;
  /** Enable MMR (Maximal Marginal Relevance) to reduce redundancy */
  useMMR?: boolean;
  /** MMR lambda - higher means more diversity (0-1) */
  mmrLambda?: number;
  /** Scope search to specific document IDs only */
  documentIds?: string[];
}

/**
 * Result chunk with relevance score
 */
export interface SearchResultChunk {
  id: string;
  content: string;
  position: number;
  documentFilename: string;
  score?: number;
}

/**
 * Perform MMR (Maximal Marginal Relevance) reranking
 * Balances relevance with diversity to avoid redundant results
 */
function mmrRerank(
  chunks: SearchResultChunk[],
  queryEmbedding: number[],
  lambda: number = 0.5,
  topK: number = 5
): SearchResultChunk[] {
  if (chunks.length <= topK) {
    return chunks;
  }

  const selected: SearchResultChunk[] = [];
  const remaining = [...chunks];

  // Select first chunk with highest similarity to query
  let firstIdx = 0;
  let maxSim = -1;
  for (let i = 0; i < remaining.length; i++) {
    // We don't have embeddings stored, so use position as proxy for relevance
    // In production, store embeddings or use a different approach
    const sim = 1 / (1 + i); // Earlier results from vector search are more relevant
    if (sim > maxSim) {
      maxSim = sim;
      firstIdx = i;
    }
  }

  selected.push(remaining[firstIdx]);
  remaining.splice(firstIdx, 1);

  // Iteratively select chunks that balance relevance and diversity
  while (selected.length < topK && remaining.length > 0) {
    let bestIdx = -1;
    let bestMMR = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const chunk = remaining[i];
      const relevance = 1 / (1 + selected.length); // Decreasing relevance
      let maxSimilarityToSelected = 0;

      // Calculate max similarity to already selected chunks
      for (const selectedChunk of selected) {
        // Approximate using content similarity (in production, use stored embeddings)
        const contentSim = jaccardSimilarity(
          chunk.content.split(""),
          selectedChunk.content.split("")
        );
        maxSimilarityToSelected = Math.max(maxSimilarityToSelected, contentSim);
      }

      const mmr = lambda * relevance - (1 - lambda) * maxSimilarityToSelected;

      if (mmr > bestMMR) {
        bestMMR = mmr;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

/**
 * Simple Jaccard similarity for content diversity
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.slice(0, 100)); // Limit for performance
  const setB = new Set(b.slice(0, 100));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Determine optimal top-K based on query complexity
 */
function calculateDynamicTopK(query: string): number {
  const queryLength = query.length;
  const hasComplexTerms = /[这那那些哪些什么哪些为什么如何怎么]/i.test(query);

  // Base top-K
  let baseK = 5;

  // Increase for longer queries (more specific)
  if (queryLength > 100) baseK = 7;
  if (queryLength > 200) baseK = 8;

  // Increase for interrogative queries (seeking specific info)
  if (hasComplexTerms) baseK += 2;

  return Math.min(baseK, 15); // Cap at 15
}

/**
 * Perform vector similarity search using pgvector.
 * Supports dynamic top-K, MMR reranking, and document scoping.
 *
 * @param userId - The user's ID for scoping
 * @param queryEmbedding - The query embedding vector
 * @param options - Search options (topK, fetchK, useMMR, mmrLambda, documentIds)
 */
export async function searchRelevantChunks(
  userId: string,
  queryEmbedding: number[],
  options: SearchOptions = {}
): Promise<SearchResultChunk[]> {
  const {
    fetchK = 10, // Fetch more than needed for reranking
    topK = 5,
    useMMR = true,
    mmrLambda = 0.5,
    documentIds,
  } = options;

  // Build dynamic topK if not specified
  const effectiveTopK = topK === 5 && options.topK === undefined
    ? calculateDynamicTopK(queryEmbedding.length > 1000 ? "long query" : "short")
    : topK;

  const effectiveFetchK = Math.max(fetchK, effectiveTopK * 2);

  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Build query based on whether document filter is specified
  let query: string;
  let params: (string | number)[];

  if (documentIds && documentIds.length > 0) {
    const docIdList = documentIds.map((id) => `'${id}'`).join(",");
    query = `
      SELECT c.id, c.content, c.position, d.filename as "documentFilename"
      FROM chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE d.user_id = $1::text
        AND d.id = ANY(ARRAY[${docIdList}])
      ORDER BY c.embedding <-> $2::vector
      LIMIT ${effectiveFetchK}
    `;
    params = [userId, embeddingStr];
  } else {
    query = `
      SELECT c.id, c.content, c.position, d.filename as "documentFilename"
      FROM chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE d.user_id = $1::text
      ORDER BY c.embedding <-> $2::vector
      LIMIT ${effectiveFetchK}
    `;
    params = [userId, embeddingStr];
  }

  const chunks = await prisma.$queryRawUnsafe(query, ...params) as SearchResultChunk[];

  // Apply MMR reranking for diversity if enabled
  if (useMMR && chunks.length > effectiveTopK) {
    return mmrRerank(chunks, queryEmbedding, mmrLambda, effectiveTopK);
  }

  return chunks.slice(0, effectiveTopK);
}

/**
 * BM25 keyword search (for hybrid retrieval)
 * Requires pg_trgm extension for trigram similarity
 */
export async function searchByKeywords(
  userId: string,
  keywords: string,
  options: { topK?: number; documentIds?: string[] } = {}
): Promise<SearchResultChunk[]> {
  const { topK = 10, documentIds } = options;

  if (!keywords.trim()) {
    return [];
  }

  // Extract search terms - split by spaces and take significant words
  const terms = keywords
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .slice(0, 10);

  if (terms.length === 0) {
    return [];
  }

  // Build document filter query
  const params: (string | number)[] = [userId, ...terms];

  const termConditions = terms
    .map((_, idx) => `similarity(c.content, $${idx + 2}) > 0.3`)
    .join(" OR ");

  let whereClause = `WHERE d.user_id = $1::text AND (${termConditions})`;

  if (documentIds && documentIds.length > 0) {
    const docIdList = documentIds.map((id) => `'${id}'`).join(",");
    whereClause += ` AND d.id = ANY(ARRAY[${docIdList}])`;
  }

  const query = `
    SELECT c.id, c.content, c.position, d.filename as "documentFilename",
           MAX(similarity(c.content, $2)) as score
    FROM chunks c
    INNER JOIN documents d ON c.document_id = d.id
    ${whereClause}
    GROUP BY c.id, c.content, c.position, d.filename
    ORDER BY MAX(similarity(c.content, $2)) DESC
    LIMIT ${topK}
  `;

  const chunks = await prisma.$queryRawUnsafe(query, ...params) as SearchResultChunk[];

  return chunks;
}

/**
 * Hybrid search combining vector and keyword search
 * Uses reciprocal rank fusion to combine results
 */
export async function hybridSearch(
  userId: string,
  queryEmbedding: number[],
  queryText: string,
  options: SearchOptions = {}
): Promise<SearchResultChunk[]> {
  const { topK = 5, documentIds } = options;

  // Execute both searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    searchRelevantChunks(userId, queryEmbedding, {
      ...options,
      topK: topK * 3, // Fetch more for fusion
      useMMR: false, // Skip MMR for fusion
    }),
    searchByKeywords(userId, queryText, {
      topK: topK * 3,
      documentIds,
    }),
  ]);

  // Reciprocal Rank Fusion
  const k = 60; // RRF constant
  const scoreMap = new Map<string, { chunk: SearchResultChunk; score: number }>();

  // Score vector results
  for (let i = 0; i < vectorResults.length; i++) {
    const chunk = vectorResults[i];
    const rrfScore = 1 / (k + i + 1);
    const existing = scoreMap.get(chunk.id);
    if (!existing || existing.score < rrfScore) {
      scoreMap.set(chunk.id, { chunk, score: rrfScore });
    }
  }

  // Score keyword results
  for (let i = 0; i < keywordResults.length; i++) {
    const chunk = keywordResults[i];
    const rrfScore = 1 / (k + i + 1);
    const existing = scoreMap.get(chunk.id);
    if (!existing) {
      scoreMap.set(chunk.id, { chunk, score: rrfScore });
    } else {
      existing.score += rrfScore;
    }
  }

  // Sort by combined score and return top-K
  const fused = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((entry) => entry.chunk);

  // Apply MMR if enabled
  if (options.useMMR && fused.length > topK) {
    return mmrRerank(fused, queryEmbedding, options.mmrLambda ?? 0.5, topK);
  }

  return fused;
}
