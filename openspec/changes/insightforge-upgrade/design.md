## Context

### 现有架构

InsightAI Dashboard 是一个 Next.js 16 全栈应用，核心功能包括：
- **文档处理**：PDF/DOCX/TXT 上传 → 文本提取 → Markdown 感知分块 → 向量嵌入
- **RAG 检索**：Hybrid Search (向量 + BM25) + MMR 重排序 + 查询改写
- **AI 对话**：Vercel AI SDK + 流式响应
- **认证**：NextAuth.js 邮箱/密码认证

### 约束条件

- 保持增量升级，不破坏现有功能
- 开发阶段 Stripe 订阅不强制限制功能
- Agent 架构采用轻量状态机，避免引入重量级框架
- 网页搜索使用免费方案（开发阶段）

## Goals / Non-Goals

**Goals:**

1. 实现 Multi-Agent 报告生成工作流，支持 Research → Retrieval → Analysis → Writing 四阶段
2. 构建可扩展的报告模板系统，预设热门模板并支持后续扩展
3. 实现完整的 Stripe 订阅流程（Checkout + Webhook + 状态管理）
4. 扩展数据模型支持项目、报告、订阅等新概念
5. 保持现有 RAG 聊天功能不变，同时复用其检索能力

**Non-Goals:**

1. 不实现团队协作功能（Team 计划预留但不开发）
2. 不实现自定义模板创建 UI（模板通过种子数据管理）
3. 不实现实时协作编辑
4. 不实现报告版本控制
5. 不实现用量限制强制校验（开发阶段）

## Decisions

### 1. Agent 架构：轻量状态机

**决策**：使用自定义状态机 + Vercel AI SDK Tool Calling，不引入 LangGraph 等框架

**理由**：
- 学习成本低，代码可控
- 与现有 Vercel AI SDK 无缝集成
- 避免额外依赖和学习曲线
- 状态流转清晰，易于调试

**架构设计**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReportGenerationWorkflow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State: idle → researching → retrieving → analyzing → writing  │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ RESEARCH │───▶│RETRIEVE  │───▶│ ANALYZE  │───▶│  WRITE   │  │
│  │          │    │          │    │          │    │          │  │
│  │ webSearch│    │ ragSearch│    │ extract  │    │ generate │  │
│  │ scrape   │    │ hybrid   │    │ charts   │    │ structured│  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
│  每个阶段：                                                      │
│  1. 执行 Tool Calling 获取数据                                   │
│  2. 流式返回状态给前端                                           │
│  3. 更新 WorkflowContext                                        │
│  4. 进入下一状态                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**备选方案**：
- LangGraph：功能强大但学习曲线陡，增加依赖
- Vercel AI SDK 原生 multiStep：较新，文档不足

### 2. 网页搜索：DuckDuckGo + Cheerio

**决策**：开发阶段使用 DuckDuckGo 搜索 + Cheerio 内容抓取

**理由**：
- 免费无 API 限制
- DuckDuckGo 搜索质量足够开发测试
- Cheerio 可处理大部分网页内容提取

**实现方式**：

```typescript
// 搜索工具
async function webSearch(query: string): Promise<SearchResult[]> {
  // 使用 duckduckgo-search 或 HTML 抓取
}

// 内容抓取工具
async function scrapeUrl(url: string): Promise<ScrapedContent> {
  // Cheerio 提取正文内容
}
```

**后续升级**：生产环境可切换到 Tavily API（专为 LLM 优化）

### 3. 结构化输出：Zod + generateObject

**决策**：使用 Vercel AI SDK 的 `generateObject` + Zod schema

**理由**：
- 原生支持，类型安全
- 自动验证输出格式
- 与现有 AI SDK 集成

**报告结构定义**：

```typescript
const ReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    citations: z.array(z.string()),
  })),
  citations: z.array(z.object({
    id: z.string(),
    type: z.enum(['web', 'document']),
    title: z.string(),
    url: z.string().optional(),
    snippet: z.string(),
  })),
});
```

### 4. 报告导出：分层实现

**决策**：
- **Markdown**：纯文本生成，最简单
- **Word**：使用 `docx` 库，纯 JS 实现
- **PDF**：使用 `@react-pdf/renderer`，React 组件渲染

**理由**：
- docx 库轻量，无需浏览器环境
- @react-pdf/renderer 支持复杂布局
- 可复用现有 React 组件样式

### 5. Stripe 集成：Checkout Session

**决策**：使用 Stripe Checkout 托管页面 + Webhook 更新状态

**流程**：

```
用户选择计划 → POST /api/stripe/checkout → Stripe Checkout 页面
                                              ↓
                                          支付成功
                                              ↓
                             POST /api/stripe/webhook → 更新数据库
```

**理由**：
- 托管页面安全，减少 PCI 合规负担
- Webhook 可靠处理状态更新
- 开发阶段可用 Stripe CLI 本地测试

### 6. 数据模型设计

**核心关系**：

```
User
├── projects[]          // 知识库
│   ├── documents[]     // 归属文档
│   └── reports[]       // 关联报告
├── reports[]           // 所有报告
├── subscription        // 订阅状态
└── usageLogs[]         // 使用记录

Report
├── template            // 使用的模板
├── project?            // 可选关联项目
└── citations[]         // 引用来源

Document
└── project?            // 可选归属项目
```

## Risks / Trade-offs

### Risk 1: 网页搜索质量不稳定

**风险**：DuckDuckGo 搜索结果可能不如 Google，部分网站反爬虫

**缓解措施**：
- 开发阶段主要用于验证流程
- 预留切换到 Tavily 的接口
- 搜索失败时优雅降级，仅使用文档检索

### Risk 2: 报告生成时间长

**风险**：四阶段流程可能需要 1-2 分钟，用户可能等待焦虑

**缓解措施**：
- 流式返回每个阶段的状态和进度
- 显示当前正在执行的步骤和已收集的信息
- 支持保存草稿，中断后可继续

### Risk 3: Token 消耗大

**风险**：报告生成需要多次 LLM 调用，Token 消耗高

**缓解措施**：
- 使用用量统计记录消耗
- 合理设置 maxTokens
- 考虑缓存中间结果

### Risk 4: Stripe Webhook 可靠性

**风险**：Webhook 可能丢失或重复

**缓解措施**：
- 使用 Stripe CLI 本地测试
- 记录 webhook 事件 ID 防重
- 实现状态查询 API 作为备选

## Migration Plan

### Phase 1: 数据库迁移

```bash
# 1. 创建新模型
prisma migrate dev --name add_insightforge_models

# 2. 添加项目字段到文档（可选，默认 null）
prisma migrate dev --name add_document_project

# 3. 种子数据：报告模板
prisma db seed
```

### Phase 2: 功能发布

1. **Alpha**：内部测试 Agent 工作流
2. **Beta**：开放报告生成，不限制功能
3. **正式**：启用 Stripe 订阅限制

### 回滚策略

- 数据库迁移使用 Prisma，可回滚
- 订阅状态默认 active，不影响现有用户
- 新页面可独立部署，不影响现有功能

## Open Questions

1. **报告草稿保存策略**：是否支持中断后继续？保存频率？
2. **并发报告生成限制**：单用户同时最多生成几个报告？
3. **模板自定义**：用户是否可以调整模板结构？
4. **引用溯源**：如何确保引用片段的准确性？

这些问题可在实现过程中根据用户反馈逐步决策。
