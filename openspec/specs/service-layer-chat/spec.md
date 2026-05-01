# Chat Service Layer Specification

## Purpose
将聊天域业务逻辑从 API Route 和 Server Actions 中提取到独立的 Service 层，提供统一的 session 管理、消息持久化和上下文构建能力。

## Requirements

### Requirement: Session CRUD
`session-service.ts` SHALL 提供完整的 session 创建、查询、更新和删除操作，所有操作均校验用户所有权。

#### Scenario: 创建 Session
- **WHEN** `createSession(userId, title?)`
- **THEN** 在 `chat_sessions` 表创建记录，返回完整 session 对象
- **THEN** `updatedAt` 等于 `createdAt`
- **AND** 如果未提供 title，默认为 "New Conversation"

#### Scenario: 获取 Session（所有权验证）
- **WHEN** `getSession(sessionId, userId)` 且 session 不属于该用户
- **THEN** 返回 `null`

#### Scenario: 获取 Session（存在且属于用户）
- **WHEN** `getSession(sessionId, userId)` 且 session 存在并属于用户
- **THEN** 返回完整 session 对象

#### Scenario: 删除 Session（级联删除消息）
- **WHEN** `deleteSession(sessionId, userId)`
- **THEN** 删除 `chat_sessions` 中对应记录及其所有关联消息（通过 Prisma cascade）
- **AND** 返回被删除的 session id

#### Scenario: 列出用户的 Sessions
- **WHEN** `listSessions(userId, limit?, offset?)`
- **THEN** 按 `updatedAt DESC` 排序返回最多 `limit` 条记录
- **AND** 默认 `limit = 50`, `offset = 0`

### Requirement: Message Persistence
`message-service.ts` SHALL 提供消息的创建、批量查询操作。

#### Scenario: 保存单条消息
- **WHEN** `saveMessage(sessionId, role, content)`
- **THEN** 在 `messages` 表插入记录，role 为 `"user"` 或 `"assistant"`
- **THEN** 返回创建的消息对象（含 id 和 createdAt）

#### Scenario: 获取 Session 的所有消息
- **WHEN** `getMessages(sessionId)`
- **THEN** 按 `createdAt ASC` 顺序返回所有消息
- **THEN** 每条消息包含 `{ id, role, content, createdAt }`

### Requirement: Prompt Builder
`prompt-builder.ts` SHALL 根据 RAG 检索结果和用户消息构建系统 prompt 和 AI messages 数组。

#### Scenario: 有相关文档片段
- **WHEN** 检索返回 3 个相关 chunks
- **THEN** system prompt 中包含 `[Document: filename, Chunk N]\n{content}` 格式的片段
- **AND** aiMessages 格式为 `[{ role: "system", content }, ...userMessages]`

#### Scenario: 无相关文档片段但有文档上传
- **WHEN** 用户已上传文档但检索未返回结果
- **THEN** system prompt 告知模型"No relevant document excerpts were found"

#### Scenario: 无文档上传
- **WHEN** 用户未上传任何文档
- **THEN** system prompt 提示用户需要先上传文档

### Requirement: Token Window Guard
`message-window.ts` SHALL 在发送请求前截断历史消息，确保总 token 数在预算范围内。

#### Scenario: 短对话不截断
- **WHEN** 消息总数约 1000 tokens（远小于 budget）
- **THEN** 返回原始消息列表（不含 system prompt）

#### Scenario: 长对话截断
- **WHEN** 消息总数约 28000 tokens（接近 30000 可用预算）
- **THEN** 丢弃最旧的轮次，保留 system prompt + 最新消息 + 最近的中间对话
- **AND** 始终保留至少 `CHAT_MIN_HISTORY_TURNS` 轮完整对话

#### Scenario: 中文消息估算
- **WHEN** 消息内容为纯中文（如 "请总结一下第三段的内容"）
- **THEN** chars/3.5 估算器给出合理 token 估计

#### Scenario: System prompt 固定保留
- **WHEN** 任何截断场景
- **THEN** system prompt 从不被截断

#### Scenario: 最新用户消息固定保留
- **WHEN** 任何截断场景
- **THEN** 最后一条消息（通常是新提问）从不被截断
