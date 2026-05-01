## 1. 新增基础设施（零破坏）

### Phase A: lib/env.ts — 环境变量验证
- [x] 1.1 创建 `lib/env.ts`，包含必需变量清单和校验逻辑
- [x] 1.2 实现 `assertEnv(name, condition?, message?)` 辅助函数
- [x] 1.3 在 `lib/prisma.ts` 顶部添加 `import "@/lib/env"`
- [x] 1.4 在 `lib/ai.ts` 顶部添加 `import "@/lib/env"`
- [ ] 1.5 手动验证：删除 `.env.local` 中的 DATABASE_URL，确认启动报错

### Phase B: lib/http/* — HTTP 包装器
- [x] 2.1 创建 `lib/http/api-error.ts`
  - ApiError 类：status, message, details 属性
  - safeMessage() 方法
- [x] 2.2 创建 `lib/http/handler.ts`
  - withAuth(handler) — 认证 + userId 注入 + try/catch
  - withApi(handler) — 纯错误处理 + JSON 响应
  - json(body, status?) 辅助函数
- [x] 2.3 创建 `lib/shared/constants.ts`
  - CHAT_TOKEN_BUDGET = 32_000
  - CHAT_RESERVED_OUTPUT_TOKENS = 2_000
  - CHAT_MIN_HISTORY_TURNS = 2
  - CHARS_PER_TOKEN = 3.5
- [ ] 2.4 验证：手动修改一个路由使用 withAuth，确认行为一致

---

## 2. Auth Service 提取（小影响）

### Phase C: lib/auth/* — 认证服务
- [x] 3.1 创建 `lib/auth/password.ts`
  - hashPassword(text) — 占位实现（明文返回）
  - verifyPassword(input, hash) — 占位比较
- [x] 3.2 创建 `lib/auth/user-service.ts`
  - findUserByEmail(email) → User | null
  - createUser(email, passwordHash, name?) → User（不含 passwordHash）
  - 邮箱重复时抛出 ApiError(409)
- [x] 3.3 创建 `lib/auth/auth-config-base.ts`
  - 从 `auth.ts` 中提取 providers、pages、session.strategy、callbacks
  - 导出为 authConfigBase 对象
- [x] 3.4 重构 `app/api/auth/[...nextauth]/auth.ts`
  - import { authConfigBase } from "@/lib/auth/auth-config-base"
  - 仅添加 adapter 配置到基础配置
- [x] 3.5 重构 `app/api/auth/[...nextauth]/auth.edge.ts`
  - import { authConfigBase } from "@/lib/auth/auth-config-base"
  - 直接使用 authConfigBase（无 adapter）
- [x] 3.6 重构 `app/api/register/route.ts`
  - 移除直接 prisma.user.findUnique/create 调用
  - 改为使用 findUserByEmail / createUser
  - 使用 withApi 包装器替代手动 try/catch
- [ ] 3.7 验证：登录/注册流程正常工作

---

## 3. Chat Service 提取（中等影响）

### Phase D: lib/chat/* — 聊天服务
- [x] 4.1 创建 `lib/chat/session-service.ts`
  - createSession(userId, title?) → ChatSession
  - getSession(sessionId, userId) → ChatSession | null
  - listSessions(userId, limit?, offset?) → ChatSession[]
  - deleteSession(sessionId, userId) → string (deleted id)
  - updateSessionTitle(sessionId, userId, title) → void（检查所有权）
- [x] 4.2 创建 `lib/chat/message-service.ts`
  - saveMessage(sessionId, role, content) → Message
  - getMessages(sessionId) → Message[]
- [x] 4.3 创建 `lib/chat/prompt-builder.ts`
  - buildSystemPrompt(contextChunks, docCount) → string
  - buildAiMessages(systemPrompt, messages) → AIMessage[]
- [x] 4.4 创建 `lib/chat/message-window.ts`
  - estimateTokens(text) → number（chars / 3.5 + 4 overhead）
  - truncateMessages(systemPrompt, messages) → AIMessage[]
    - Pin: system + 最后一条消息
    - Walk newest→oldest
    - minTurns 保护
    - 清理孤立 assistant 消息
- [x] 4.5 重构 `app/api/chat/route.ts`
  - 将 session CRUD 替换为 session-service
  - 将消息保存替换为 message-service
  - 将 prompt 构建替换为 prompt-builder
  - 添加 truncateMessages 到 streamText 之前
  - 使用 withAuth 包装器
  - 目标行数：~50-60 行（原 ~150 行）
- [x] 4.6 重构 `app/actions/chat-actions.ts`
  - getChatSessions → use session-service.listSessions
  - getChatSessionMessages → use message-service.getMessages
  - createChatSession → use session-service.createSession
  - deleteChatSession → use session-service.deleteSession（保留 revalidatePath）
  - updateChatSessionTitle → use session-service.updateSessionTitle
- [ ] 4.7 验证：聊天功能完整流程（新建 session、发送消息、历史加载、删除 session）

---

## 4. Document Service 提取（中等影响）

### Phase E: lib/documents/* — 文档服务
- [x] 5.1 创建 `lib/documents/document-validator.ts`
  - ALLOWED_MIME_TYPES 常量
  - validateMime(type) → { valid, format }
  - validateSize(fileSize) → boolean
  - MAX_FILE_SIZE = 50 * 1024 * 1024
- [x] 5.2 创建 `lib/documents/document-repository.ts`
  - createDocumentRecord(...) → Document
  - updateDocumentStatus(id, status, extra?) → void
  - insertChunks(chunkData[]) → void（批量事务）
  - countReadyDocuments(userId) → number
  - getDocumentForUser(documentId, userId) → Document | null
- [x] 5.3 重构 `app/api/documents/upload/route.ts`
  - 提取 MIME/size 校验到 document-validator
  - 提取 Prisma 操作到 document-repository
  - 保留内联的文本提取+分块+嵌入逻辑（后续异步化再动）
- [x] 5.4 重构 `app/api/documents/[id]/route.ts`（delete）
  - 使用 withAuth 包装器
  - 所有权检查通过 session-service 或 repository
- [x] 5.5 重构 `app/api/documents/route.ts`（list）
  - 使用 withAuth 包装器
- [ ] 5.6 验证：文档上传、列表、删除流程正常

---

## 5. Analytics 优化（小影响）

### Phase F: SQL 聚合迁移
- [x] 6.1 创建 `lib/analytics/analytics-service.ts`
  - getDashboardStats(userId) → { totalDocuments, ... }（Promise.all $queryRaw）
  - getDocumentsOverTime(userId) → { date, count }[]（GROUP BY date_trunc）
  - getChatActivity(userId) → { date, count }[]（含 30 天过滤）
  - getDocumentFormatDistribution(userId) → { format, count }[]（ORDER BY count DESC）
- [x] 6.2 重构 `app/actions/analytics-actions.ts`
  - 每个 action 委托给 analytics-service 对应方法
  - 保留 requireAuth 检查和 revalidatePath
- [ ] 6.3 验证：仪表盘页面数据展示正确

---

## 6. UI 组件库标准化（中等影响）

### Phase G: shadcn/ui 组件库集成
- [x] 7.1 安装 shadcn/ui 组件库
  - `npm install shadcn-ui`
  - `npm install lucide-react class-variance-authority tailwind-merge clsx tw-animate-css`
- [x] 7.2 初始化 shadcn/ui（使用默认配置）
  - `npx shadcn@latest init`
  - 确保使用 Tailwind v4 的配置兼容
- [x] 7.3 创建 `components/ui/` 目录
  - 创建组件包装：Button, Input, Card, Label, Badge, Alert, Dialog, Progress, Separator, Textarea, Skeleton
- [x] 7.4 创建主题系统组件
  - `components/ui/ThemeProvider.tsx`
  - `components/ui/ThemeToggle.tsx`
- [x] 7.5 创建对话框和通知组件
  - `components/ui/ConfirmDialog.tsx`
  - `components/ui/Toast.tsx`
  - `components/ui/ToastProvider.tsx`
- [x] 7.6 重构登录页 (app/login/page.tsx)
  - 使用 shadcn/ui 组件替换所有自定义组件
  - 保持功能和样式一致
- [x] 7.7 重构注册页 (app/register/page.tsx)
  - 使用 shadcn/ui 组件替换所有自定义组件
  - 保持功能和样式一致
- [x] 7.8 重构仪表盘页 (app/dashboard/page.tsx)
  - 使用 shadcn/ui Card 组件
  - 使用 shadcn/ui StatCard（如已有组件）
- [x] 7.9 重构文档页 (app/dashboard/documents/page.tsx)
  - 使用 shadcn/ui Card 组件
  - 使用 shadcn/ui Badge 组件
  - 使用 shadcn/ui Button 组件
- [x] 7.10 重构分析页 (app/dashboard/analytics/page.tsx)
  - 使用 shadcn/ui Card 组件
- [x] 7.11 重构聊天页 (app/dashboard/chat/ChatClient.tsx)
  - 使用 shadcn/ui Input/Textarea 组件
  - 使用 shadcn/ui Button 组件
  - 使用 shadcn/ui Card 组件
- [x] 7.12 重构聊天侧边栏 (components/ChatSidebar.tsx)
  - 使用 shadcn/ui Button 组件
  - 使用 shadcn/ui Separator 组件
  - 使用 shadcn/ui Badge 组件
- [x] 7.13 重构文件上传组件 (components/FileUpload.tsx)
  - 使用 shadcn/ui Card 组件
  - 使用 shadcn/ui Progress 组件
  - 使用 shadcn/ui Badge 组件
- [x] 7.14 重构删除文档按钮 (components/DeleteDocumentButton.tsx)
  - 使用 shadcn/ui Button 组件
  - 使用 shadcn/ui Dialog 组件
- [x] 7.15 重构统计卡片 (components/StatCard.tsx)
  - 使用 shadcn/ui Card 组件
- [x] 7.16 验证：所有页面 UI 正常工作，样式一致

---

## 7. 清理（最后一步）

### Phase H: 废弃代码移除
- [ ] 8.1 删除 `lib/auth-guard.ts`（已被 withAuth 替代）
- [x] 8.2 更新所有文件中的 `@prisma/client` 导入为 `@/generated/prisma/client`
- [x] 8.3 统一 `chatModel`/`embeddingModel` 默认值引用（优先用 env 而非硬编码字符串）
- [x] 8.4 运行 `npm run typecheck` 确保类型检查通过
- [x] 8.5 运行 `npm run build` 确保构建通过
- [ ] 8.6 最终 smoke test：登录 → 上传文档 → 聊天 → 查看仪表盘

---

## Verification Checklist

- [ ] `npm run typecheck` ✅
- [ ] `npm run build` ✅
- [ ] 登录流程正常 ✅
- [ ] 注册流程正常 ✅
- [ ] 文档上传并可用于 RAG 聊天 ✅
- [ ] 对话可延续多轮 ✅
- [ ] 聊天历史加载正确 ✅
- [ ] Session 创建/删除/重命名 ✅
- [ ] 仪表盘统计数据正确 ✅
- [ ] 时间序列图表显示正常 ✅
- [ ] 格式分布饼图显示正常 ✅
- [ ] UI 组件样式统一 ✅
