## Why

项目当前代码组织存在三个主要问题：

1. **重复的认证模式** — `requireAuth()` 在每个 API 路由和 Server Action 中重复编写，出错空间大且难以统一错误处理。
2. **Prisma 直接调用散布在 UI 层** — chat 路由、Server Actions、API 路由直接操作 Prisma，业务逻辑（session 验证、消息持久化）没有隔离。
3. **UI 组件和样式不统一** — 硬编码颜色值遍布各页面，缺少共享组件库。

这些问题叠加导致：修改一处逻辑需要翻多个文件；新功能容易引入一致性 bug；代码审查成本高昂。

## What Changes

### 新增模块

| Path | Purpose |
|------|---------|
| `lib/env.ts` | 一次性环境变量验证；启动时快速失败 |
| `lib/http/api-error.ts` | `ApiError` 类：HTTP 状态码 + 安全消息 |
| `lib/http/handler.ts` | `withAuth` / `withApi` 包装器 — 认证检查、try/catch、JSON 响应 |
| `lib/auth/password.ts` | 密码哈希/验证（目前为明文通过占位） |
| `lib/auth/user-service.ts` | `findUserByEmail` / `createUser` 业务逻辑 |
| `lib/chat/session-service.ts` | Session CRUD + 所有权检查 |
| `lib/chat/message-service.ts` | 消息持久化，供流式处理器 + actions 使用 |
| `lib/chat/prompt-builder.ts` | 构建系统提示 + 历史上下文窗口 |
| `lib/chat/rag-service.ts` | 检索增强问答扩展 |
| `lib/chat/message-window.ts` | 滑动窗口截断，确保每条请求在配置的 token 预算内 |
| `lib/analytics/analytics-service.ts` | SQL GROUP BY 聚合，替换内存中的 groupBy |

### UI 组件库改造

- **新增** 使用 `shadcn/ui` 替换现有自定义 UI 组件库
- **新增** `components/ui/` 目录用于存放 shadcn 组件包装
- **新增** `components/ui/ThemeProvider.tsx` 和 `components/ui/ThemeToggle.tsx` 实现主题系统
- **新增** `components/ui/ConfirmDialog.tsx` 实现确认对话框
- **新增** `components/ui/Toast.tsx` 和 `components/ui/ToastProvider.tsx` 实现通知系统

### 重构路径

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `app/api/chat/route.ts` (150行) | `app/api/chat/route.ts` (~40行) | 瘦化为适配器，调用 service 层 |
| `app/actions/chat-actions.ts` | `app/actions/chat-actions.ts` | 改为委托给 `session-service` / `message-service` |
| `app/actions/analytics-actions.ts` | `app/actions/analytics-actions.ts` | 改为委托给 `analytics-service` |
| `app/api/register/route.ts` | `app/api/register/route.ts` | 改为调用 `user-service` |
| `app/api/auth/[...nextauth]/auth.ts` | `app/api/auth/[...nextauth]/auth-config.ts` | 提取共享 NextAuth 配置 |
| `app/api/auth/[...nextauth]/auth.edge.ts` | `app/api/auth/[...nextauth]/auth.edge.ts` | 引用 auth-config.ts，消除重复 |

### 移除 / 废弃

- `lib/auth-guard.ts` — 被 `withAuth` 包装器替代
- analytics 中的内存 `groupBy` — 被 SQL 聚合替代
- 两个 auth 文件的 provider 复制粘贴
- 所有硬编码颜色值和样式类

## Capabilities

### New Capabilities
- `http-handler-api` — 统一 HTTP 响应处理和认证包装器
- `service-layer-chat` — 聊天域 Service 层抽象
- `service-layer-auth` — 认证域 Service 层抽象
- `service-layer-documents` — 文档域 Service 层抽象
- `env-validation` — 环境变量启动时校验
- `token-context-window` — 聊天消息滑动窗口管理
- `sql-analytics-aggregation` — 基于 SQL 的聚合分析

### Modified Capabilities
- `prisma-driver-adapter` — 无变更，继续使用

## Impact

**受影响的文件（约 15-20 个）：**

```
新建:
  lib/env.ts                          # 环境变量验证
  lib/http/api-error.ts               # 统一错误类
  lib/http/handler.ts                 # withAuth/withApi 包装器
  lib/auth/password.ts                # 密码操作
  lib/auth/user-service.ts            # 用户业务逻辑
  lib/chat/session-service.ts         # Session 服务
  lib/chat/message-service.ts         # 消息服务
  lib/chat/prompt-builder.ts          # Prompt 构建
  lib/chat/rag-service.ts             # RAG 服务
  lib/chat/message-window.ts          # Token 窗口截断
  lib/analytics/analytics-service.ts  # SQL 聚合

重构:
  app/api/chat/route.ts              → 调用 chat services
  app/api/documents/*                 → 调用 document services
  app/api/register/route.ts           → 调用 user-service
  app/api/auth/[...nextauth]/*        → 共享 auth config
  app/actions/chat-actions.ts         → 调用 session/message services
  app/actions/analytics-actions.ts    → 调用 analytics-service
  middleware.ts                       → 使用 withAuth handler
  components/ChatSidebar.tsx          → 调用新的 actions
  所有 prisma 导入                    → 使用 @/generated/prisma
```

**运行时影响：** 零。所有公共 API 契约保持不变。

## Non-Goals

- 不引入外部队列系统（Inngest、Bull 等）
- 不做数据库 schema 变更
- 不迁移 LLM 提供商（已切换到 DashScope，无需变动）
- 不实现 Dark Mode 或 shadcn/ui 替换（留作后续独立变更）
- 不修改现有测试（如无现有测试）

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Service 层提取可能引入循环依赖 | 低 | 按领域分层，禁止跨领域直接调用 |
| 重构期间可能引入回归 | 中 | TypeScript 严格模式 + 逐文件重构 + 手动 smoke test |
| 临时双写期增加维护负担 | 低 | 一次性 PR，不设并行开发分支 |
| `withAuth` handler 与现有 `requireAuth` 行为差异 | 中 | `withAuth` 兼容 `requireAuth` 的返回格式 |
