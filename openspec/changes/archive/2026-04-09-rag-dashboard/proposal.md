## Why

当前项目需要构建一个 AI 智能仪表盘应用，支持 RAG（检索增强生成）知识库聊天和数据可视化。用户可以上传文档到知识库，通过 AI 聊天基于文档内容进行智能问答，同时在仪表盘中查看数据趋势和分析图表。这是一个从零开始的全新项目。

## What Changes

- 使用 Next.js 全家桶搭建项目基础结构（App Router）
- 集成 Auth.js v5 (next-auth@5) 实现用户认证和登录页
- 集成 Postgres + Prisma ORM 作为数据持久层
- 在 Postgres 中创建 documents 表，存储上传文件及其向量嵌入
- 使用 Vercel AI SDK + 腾讯混元（免费模型）实现 RAG 流程（embedding + retrieval）
- 使用 useChat hook 实现流式 AI 聊天界面
- 使用 Recharts 构建数据可视化仪表盘图表
- 支持文件上传并解析为向量存储
- 支持 Vercel 部署

## Capabilities

### New Capabilities
- `user-auth`: 用户认证与登录，基于 Auth.js v5 (next-auth@5) 实现，包含登录页和会话管理
- `file-upload`: 文件上传功能，支持文档上传、解析和向量化存储到 Postgres
- `rag-chat`: RAG 知识库聊天，基于 Vercel AI SDK + 腾讯混元 Lite/Embedding（免费）实现 embedding + retrieval，使用 useChat hook 提供流式聊天体验
- `data-dashboard`: 数据可视化仪表盘，使用 Recharts 展示 mock/real 数据趋势图表

### Modified Capabilities
（无，这是全新项目）

## Impact

- **技术栈**: Next.js 16.x, React 19.x, TypeScript 5.x, Tailwind CSS 4.x
- **认证**: Auth.js v5 (next-auth@5)
- **数据库**: Supabase PostgreSQL（免费版 500MB）+ Prisma ORM 6.x + pgvector 扩展
- **AI**: Vercel AI SDK 4.x，聊天模型使用腾讯混元 Lite（免费），Embedding 使用腾讯混元 Embedding（免费）
- **可视化**: Recharts 最新版
- **部署**: Vercel Hobby 免费版 + Supabase 免费版（完全零成本）
- **API**: Next.js API Route Handlers + Server Actions