/**
 * Agent 工作流类型定义
 */

/**
 * 工作流状态
 */
export type WorkflowState =
  | 'idle'
  | 'researching'
  | 'retrieving'
  | 'analyzing'
  | 'writing'
  | 'completed'
  | 'error';

/**
 * 工作流阶段
 */
export interface WorkflowStage {
  state: WorkflowState;
  message: string;
  progress?: number; // 0-100
  data?: Record<string, unknown>;
}

/**
 * Web 研究结果
 */
export interface WebResearchResult {
  query: string;
  results: WebSearchResult[];
  scrapedContents: ScrapedContent[];
}

/**
 * Web 搜索结果
 */
export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
}

/**
 * 抓取的内容
 */
export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
}

/**
 * 文档检索结果
 */
export interface RetrievalResult {
  projectId?: string;
  chunks: DocumentChunk[];
  totalSearched: number;
  totalRetrieved: number;
}

/**
 * 文档块
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  insights: Insight[];
  charts: ChartData[];
  summary: string;
}

/**
 * 洞察
 */
export interface Insight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  sources: string[]; // citation IDs
}

/**
 * 图表数据
 */
export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  data: Record<string, unknown>;
}

/**
 * 报告部分
 */
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  citations: string[];
}

/**
 * 引用
 */
export interface Citation {
  id: string;
  type: 'web' | 'document';
  title: string;
  url?: string;
  snippet: string;
}

/**
 * 报告结果
 */
export interface ReportResult {
  title: string;
  summary: string;
  sections: ReportSection[];
  citations: Citation[];
}

/**
 * 工作流上下文
 */
export interface WorkflowContext {
  reportId: string;
  topic: string;
  projectId?: string;
  templateId: string;
  
  // 当前状态
  currentState: WorkflowState;
  stages: WorkflowStage[];
  
  // 各阶段数据
  researchResult?: WebResearchResult;
  retrievalResult?: RetrievalResult;
  analysisResult?: AnalysisResult;
  reportResult?: ReportResult;
  
  // 错误信息
  error?: string;
  
  // Token 使用量
  tokensUsed: number;
}

/**
 * Agent 结果
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
}

/**
 * 流式更新
 */
export interface StreamUpdate {
  type: 'stage' | 'progress' | 'content' | 'error' | 'complete';
  stage?: WorkflowState;
  message?: string;
  progress?: number;
  data?: unknown;
  error?: string;
}
