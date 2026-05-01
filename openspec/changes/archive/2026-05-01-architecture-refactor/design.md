## Context

项目 `insightai-dashboard` 是一个 Next.js 16 + TypeScript 全栈应用，包含：
- 基于 Auth.js v5 的用户认证（Credentials Provider）
- 文档上传 → 文本提取 → 分块 → 嵌入 → pgvector 向量存储的 RAG 流程
- AI 聊天界面（流式响应）
- 数据可视化仪表盘

当前技术栈：Next.js App Router, Prisma 7 (pg adapter), Tailwind CSS 4, Vercel Hobby 部署。

### 核心问题

**问题 1: 重复的认证检查模式**

```typescript
// 每个路由都这样写...
const guard = await requireAuth();
if ("response" in guard) return guard.response;
const userId = guard.userId;
```

`requireAuth()` 在 8+ 个文件中重复调用。错误响应格式不统一（401 vs 500）。

**问题 2: Service 层缺失**

```
app/api/chat/route.ts (150行):
  ├── 认证
  ├── Session CRUD
  ├── 消息持久化
  ├── 向量搜索调用
  ├── Prompt 构建
  └── AI 流式 + 响应后写入

app/actions/chat-actions.ts (80行):
  └── 与 route.ts 完全相同的 session/userId 验证逻辑
```

两个入口点做完全相同的事。

**问题 3: 内存分析聚合**

`analytics-actions.ts` 获取全表数据后在 JS 中 groupBy：
```typescript
// 获取所有文档，然后在 JS 中分组...
const documents = await prisma.document.findMany({ where: { userId } });
documents.forEach(doc => { ... });
```

用户数据增长后这是 O(n) 的全表扫描。

---

## Goals / Non-Goals

### Goals

- 消除所有重复的认证检查代码
- 将业务逻辑从 API/Action 层提取到 Service 层
- 统一 HTTP 错误处理和响应格式
- 分析查询改为 SQL 聚合，避免内存 groupBy
- Token 窗口防止长对话超出模型上下文限制
- 共享 NextAuth 配置消除 auth.ts / auth.edge.ts 重复
- 统一 UI 组件库为 shadcn/ui

### Non-Goals

- 不引入队列系统
- 不修改数据库 schema
- 不添加测试框架或现有测试

---

## Architecture Decisions

### D1: HTTP 包装器设计

**选择：** 两种 handler —— `withAuth` 和 `withApi`

```typescript
// withAuth — 需要 userId 的路由
export const POST = withAuth(async (req, context) => {
  // context.userId 已认证
  const sessionId = await getSession(context.userId);
  return json({ sessionId });
});

// withApi — 公开路由
export const GET = withApi(async () => {
  const data = await fetchData();
  return json({ data });
});
```

**Why:**
- `withAuth` 内置认证检查 + userId 注入，替代 `requireAuth()`
- 统一 try/catch → ApiError → JSON 响应
- 保持函数风格（无类），易于测试和 mock
- 返回 `Response` 对象，与 Route Handler 直接兼容

**对比方案 B（中间件方式）**：中间件无法访问请求体，不适合 JWT/session 解析。Route Handler 内包装更合适。

### D2: Service 层按领域划分

**选择：** `lib/auth/`, `lib/chat/`, `lib/documents/` 三个域目录

```
lib/
├── auth/
│   ├── user-service.ts      # findUserByEmail, createUser
│   └── password.ts          # hashPassword, verifyPassword
├── chat/
│   ├── session-service.ts   # createSession, getSession, deleteSession
│   ├── message-service.ts   # saveMessage, getMessages
│   ├── prompt-builder.ts    # buildSystemPrompt, buildAiMessages
│   ├── rag-service.ts       # searchRelevantChunks (封装 vector-search.ts)
│   └── message-window.ts    # truncateMessages (Token 窗口)
└── analytics/
    └── analytics-service.ts # aggregation queries
```

**Why:**
- 每个文件职责单一，不超过 60 行
- 便于独立测试和引用
- 与未来 Inngest worker 复用同一 service

**对比方案 B（单文件 service）**：一个大 `chat-service.ts` 文件会再次回到同样的问题。领域划分解决 scalability 问题。

### D3: Token 滑动窗口算法

**选择：** 保守 chars-based 估算 + 最小历史轮数保护

```
算法步骤:
1. 保留 system prompt (固定占用 ~500 tokens)
2. 保留最新消息（通常是用户的新问题，不可截断）
3. 从新到旧遍历历史消息，累加 token 估计
4. 当达到 CHAT_TOKEN_BUDGET - CHAT_RESERVED_OUTPUT_TOKENS 时停止
5. 至少保留 CHAT_MIN_HISTORY_TURNS 轮完整对话

参数默认值:
  CHAT_TOKEN_BUDGET        = 32_000
  CHAT_RESERVED_OUTPUT_TOKENS = 2_000
  CHAT_MIN_HISTORY_TURNS   = 2
```

**Why:**
- Qwen 3.6 Plus 支持 128K 上下文，32K 预算足够使用
- chars/3.5 对中英文混合场景是一个合理的保守估计
- 不使用 tiktoken（DashScope 不提供官方 BPE 文件）
- `minTurns` 确保最基础的对话连续性

**风险缓解：** 如果用户报告"AI 不知道我之前说的内容"，可调高 `CHAT_TOKEN_BUDGET` 或切换到摘要策略。

### D4: Shared Auth Config

**选择：** 提取 provider 配置到单独文件

```typescript
// lib/auth/auth-config-base.ts
export const authConfigBase = {
  providers: [ /* credentials provider 配置 */ ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: { jwt, session },
};

// app/api/auth/[...nextauth]/auth.ts
import { authConfigBase } from "@/lib/auth/auth-config-base";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth } = NextAuth({
  ...authConfigBase,
  adapter: PrismaAdapter(prisma),
});

// app/api/auth/[...nextauth]/auth.edge.ts
import { authConfigBase } from "@/lib/auth/auth-config-base";

export const { handlers, auth } = NextAuth(authConfigBase);
```

**Why:**
- 只有一个地方需要修改 provider、callback、session 策略
- Edge runtime 无需 Prisma adapter，但其他配置完全一致
- 减少维护负担（之前两个文件有 60+ 行重复）

### D5: SQL 聚合

**选择：** `$queryRaw` GROUP BY 替代 JS groupBy

```typescript
// Documents over time
SELECT date_trunc('day', created_at)::date as date, count(*) as count
FROM documents WHERE user_id = $1
GROUP BY date ORDER BY date;

// Chat activity (last 30 days)
SELECT date_trunc('day', created_at)::date as date, count(*) as count
FROM messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY date ORDER BY date;

// Format distribution
SELECT split_part(mime_type, '/', -1) as format, count(*) as count
FROM documents WHERE user_id = $1
GROUP BY format ORDER BY count DESC;
```

**Why:**
- DB 层面完成聚合，数据量无关性能
- 零依赖，纯 SQL
- 与现有 pg adapter 无缝兼容

### D6: UI 组件库标准化

**选择：** 使用 `shadcn/ui` 作为统一组件库

**Why:**
- 保证 UI 一致性，提高开发效率
- 降低维护成本（一个组件库胜过多个自定义组件）
- 提供可访问性支持（keyboard navigation, ARIA）
- 基于 Tailwind CSS，与项目现有样式体系兼容
- 与项目使用的 Tailwind v4 兼容（通过 CSS 变量）

**实现路径：**
1. 安装 shadcn/ui 组件（Button, Input, Card, Label, Badge, Alert, Dialog, Progress, Separator, Textarea, Skeleton）
2. 创建 `components/ui/` 目录存放组件包装
3. 更新所有现有组件为 shadcn/ui 版本
4. 保留公共 API 接口，确保兼容性
5. 集成主题系统（next-themes）和暗色模式

---

## Module Interactions

```
                    ┌─────────────────────────┐
                    │     Route Handlers      │
                    │  (app/api/*, actions/)  │
                    └─────────┬───────────────┘
                              │ 调用
                    ┌─────────▼───────────────┐
                    │      Service Layer       │
                    │                          │
                    │  auth/       chat/       │
                    │  documents/  analytics/  │
                    └─────────┬───────────────┘
                              │ 调用
                    ┌─────────▼───────────────┐
                    │   Infrastructure         │
                    │   prisma.ts              │
                    │   ai.ts                  │
                    │   vector-search.ts       │
                    │   document-processor.ts  │
                    └─────────────────────────┘
```

**依赖方向严格自上而下：**
- Route Handler → Service → Infrastructure
- Service **禁止** 直接调用 Route Handler
- Service 之间尽量避免循环依赖（如 `chat-service` 引用 `document-service`）

---

## Migration Strategy

采用 **"改写"** 而非 **"并行"** 策略：

```
Phase A: 新增基础设施（零破坏）
  └── lib/env.ts, lib/http/*.ts

Phase B: 提取 auth 服务（小影响）
  ├── lib/auth/user-service.ts
  ├── lib/auth/password.ts
  └── 重构 register/route.ts 使用 new service

Phase C: 提取 chat 服务（中等影响）
  ├── lib/chat/session-service.ts
  ├── lib/chat/message-service.ts
  ├── lib/chat/prompt-builder.ts
  ├── lib/chat/message-window.ts
  └── 重构 api/chat/route.ts 和 chat-actions.ts

Phase D: 提取 analytics 优化（小影响）
  └── lib/analytics/analytics-service.ts

Phase E: 清理（最后一步）
  ├── 删除 lib/auth-guard.ts
  └── 统一导入路径
```

每 Phase 结束都应可编译通过且功能不变。
