## Context

当前项目是一个全新的 Next.js 16 应用，基础结构已搭建（App Router + React 19 + Tailwind CSS 4 + TypeScript），但没有数据库、认证、或 AI 集成。需要从零构建完整的 RAG 仪表盘系统。

**约束条件：**
- 零成本部署：Vercel Hobby 免费版 + Supabase 免费版 (500MB)
- 腾讯混元提供 OpenAI 兼容 API
- 支持最大 50MB 文档上传
- 严格用户数据隔离

## Goals / Non-Goals

**Goals:**
- 用户注册/登录并管理个人知识库
- 上传文档（PDF/TXT/MD/DOCX）并自动向量化存储
- 基于 RAG 的 AI 聊天，回答基于用户上传的文档内容
- 数据可视化仪表盘展示文档统计、聊天使用量等
- 流式响应体验
- 完全用户隔离，A 用户无法访问 B 用户数据

**Non-Goals:**
- 多用户共享知识库（本期不做）
- 实时协作编辑
- 移动端原生应用
- 自定义 AI 模型训练
- 文档在线编辑（仅上传/查看元数据）
- 向量数据库外部服务（仅用 pgvector）

## Decisions

### 1. AI Provider: 腾讯混元 via OpenAI 兼容 API

**决策:** 使用 `@ai-sdk/openai` 配置 `baseURL: https://api.hunyuan.cloud.tencent.com/v1`

**理由:**
- 腾讯混元提供完整 OpenAI 兼容接口
- 可直接复用 Vercel AI SDK 的所有能力（流式、useChat、streamText 等）
- 零额外开发成本，无需手写 custom provider

**备选方案:**
- 手写 `LanguageModelV1` 实现 → 维护成本高，弃用
- 使用 `openai` Python SDK → 与 Node.js 技术栈不匹配，弃用

### 2. 向量存储: PostgreSQL + pgvector + Prisma Raw Queries

**决策:** Supabase Postgres 启用 pgvector 扩展，Prisma 管理 schema，相似度搜索用 `prisma.$queryRaw` 手写 SQL

**理由:**
- pgvector 是 Postgres 原生扩展，Cosine 相似度搜索性能优秀
- Prisma 6.x 支持 `Vector` 类型字段
- Prisma ORM 不直接支持向量相似度搜索，必须用 raw SQL
- 避免引入外部向量数据库依赖（Pinecone 等），保持零成本

**SQL 模式:**
```sql
SELECT id, content, position
FROM chunks
WHERE doc_id IN (SELECT id FROM documents WHERE user_id = $1)
ORDER BY embedding <-> $2::vector
LIMIT 5
```

### 3. 文档分块策略

**决策:** 固定大小分块，每块 500-1000 tokens，重叠 100 tokens

**理由:**
- 简单可靠，易于实现
- 500-1000 tokens 平衡了检索精度和上下文窗口
- 100 token 重叠避免关键信息被截断
- 后续可优化为语义分块（按段落/标题），但 MVP 阶段不需要

### 4. 文件处理: 同步处理 + 大小限制

**决策:** 文档上传、解析、向量化全部在一个请求中同步完成，限制最大 50MB

**理由:**
- 实现简单，无需消息队列或后台任务系统
- 50MB 纯文本解析 + 向量化通常在 Vercel 10s 限制内
- 如果后续超时再改为异步队列（Bull/Upstash）

**风险:** 大文件或多文件并发可能触发 Vercel Serverless 超时
**缓解:** 设置上传大小限制、监控函数执行时间、后续可改为异步

### 5. 用户认证: Auth.js v5 (NextAuth)

**决策:** 使用 Auth.js v5 + Credentials Provider + JWT session + PostgreSQL 适配器

**理由:**
- 与 Next.js 深度集成
- v5 支持 App Router 和 Server Components
- JWT session 减少数据库查询
- 支持自定义登录/注册页面

### 6. 流式聊天: Vercel AI SDK useChat Hook

**决策:** 客户端使用 `useChat` hook，服务端用 `streamText` + `OpenAIStream`

**理由:**
- `useChat` 内置消息管理、流式处理、错误处理
- 与服务端 `streamText` 无缝配合
- 自动处理 SSE (Server-Sent Events) 流式传输

### 7. API Route Handler vs Server Action 选择策略

**决策:** 根据场景选择最合适的方式，不强制使用某一种。

**选择标准:**

| 场景 | 选择 | 原因 |
|------|------|------|
| 用户注册表单 | Server Action | 表单提交，支持渐进增强，自动序列化 |
| 用户登录表单 | Server Action | Auth.js v5 支持 Credentials 登录用 Server Action |
| 文件上传处理 | API Route Handler | 需要处理 multipart/form-data 和大文件流式上传 |
| 文档列表查询 | Server Action | 服务端组件直接调用，无需 HTTP 往返 |
| 文档删除 | API Route Handler | RESTful DELETE 语义明确 |
| AI 流式聊天 | API Route Handler | **必须**：只有 API Handler 支持 SSE 流式响应 |
| 聊天历史加载 | Server Action | 服务端组件数据获取，避免客户端 fetch |
| 数据分析/图表 | Server Action | 服务端组件直接调用，避免额外 API |
| Auth.js 端点 | API Route Handler | 框架要求：`/api/auth/[...nextauth]` 必须是 Route Handler |

**核心原则:**
- **流式响应** → API Handler（唯一选择）
- **表单提交** → Server Action（渐进增强）
- **服务端组件数据获取** → Server Action（性能最优）
- **RESTful CRUD** → API Handler（语义清晰）
- **第三方调用** → API Handler（唯一能被外部调用的方式）

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Vercel Serverless 10s 超时 | 大文件上传可能失败 | 限制 50MB，监控执行时间，后续改异步队列 |
| 腾讯混元 API 限流 | 聊天/向量化被限流 | 实现请求队列/退避重试，监控 API 使用量 |
| pgvector 内存占用 | 500MB Supabase 限制可能不够 | 定期清理无用文档，压缩向量，监控存储使用 |
| 向量检索准确性 | 固定分块可能截断语义 | 调整分块大小和重叠，后续改用语义分块 |
| 用户数据泄露 | 查询忘记过滤 user_id | 所有查询封装在 Server Actions 中，强制 user_id 过滤 |
| 混元 API 兼容性变化 | 腾讯修改 API 格式导致集成失效 | 封装 AI provider 层，便于切换模型供应商 |

## Migration Plan

**部署步骤:**
1. 创建 Supabase 项目，启用 pgvector 扩展
2. 运行 `prisma generate` + `prisma db push` 创建表结构
3. 配置 Vercel 环境变量: `DATABASE_URL`, `HUNYUAN_API_KEY`
4. 部署到 Vercel
5. 测试上传、聊天、检索功能

**Rollback 策略:**
- Prisma 使用 `db push` 而非 `migrate`，rollback 需手动恢复数据
- 数据库变更通过 Git 管理 schema 文件，可回滚代码后重新 push
- 文档和聊天数据定期备份 Supabase

## Open Questions

1. **混元 Embedding 维度**: 需确认腾讯混元 Embedding 模型的输出维度（通常 768/1024/1536），影响 pgvector 列定义
2. **支持的文档格式**: PDF/TXT/MD 容易解析，DOCX 需要额外库，是否需要支持 Excel/PPT？
3. **聊天上下文**: 多轮聊天是否保留历史消息作为上下文？还是每轮独立 RAG 检索？
