# Token Context Window Specification

## Purpose
在每次 AI 请求前对历史消息进行滑动窗口截断，确保发送到模型的总 token 数不超过配置的预算。

## Requirements

### Requirement: Token 预算参数
系统 SHALL 使用可配置的 token 预算参数控制上下文窗口大小。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `CHAT_TOKEN_BUDGET` | 32,000 | 最大 token 数（含 system prompt + 所有消息） |
| `CHAT_RESERVED_OUTPUT_TOKENS` | 2,000 | 为模型输出预留的 token 数 |
| `CHAT_MIN_HISTORY_TURNS` | 2 | 至少保留的完整对话轮数 |
| `CHARS_PER_TOKEN` | 3.5 | 中文/英文混合估算比率 |

#### Scenario: 使用默认配置
- **WHEN** 未设置环境变量覆盖
- **THEN** 可用上下文 = 32,000 - 2,000 = 30,000 tokens

#### Scenario: 自定义预算
- **WHEN** `CHAT_TOKEN_BUDGET=64000`
- **THEN** 可用上下文 = 64,000 - 2,000 = 62,000 tokens

### Requirement: truncateMessages 函数
`message-window.ts` SHALL 提供 `truncateMessages(systemPrompt, messages)` 函数，返回截断后的消息数组。

#### Scenario: 短于预算不截断
- **WHEN** systemPrompt(500) + 所有消息总和 < 可用上下文
- **THEN** 返回 `[systemPrompt, ...messages]` 原始数组

#### Scenario: 超出预算截断最旧消息
- **WHEN** systemPrompt(500) + 消息总和 = 35,000 tokens（超出 30,000 预算）
- **THEN** 从最旧的消息开始丢弃，直到总 token 数 ≤ 预算
- **AND** 始终保留最后一条消息和 system prompt

#### Scenario: minTurns 保护
- **WHEN** 按预算计算只能保留 1 轮历史对话
- **THEN** 强制保留至少 `CHAT_MIN_HISTORY_TURNS` (2) 轮完整对话
- **AND** 允许轻微超出预算以换取完整的对话轮次

#### Scenario: 去除孤立的 assistant 消息
- **WHEN** 截断后第一条消息是 assistant 回复（没有对应的前置 user 消息）
- **THEN** 移除该孤立 assistant 消息

#### Scenario: console.info 日志
- **WHEN** 发生截断
- **THEN** 输出 `console.info("Token window truncated:", { droppedCount, estimatedTokens })`

### Requirement: 嵌入方式
估算不使用 tiktoken 或外部库，仅使用 chars/3.5 的经验公式。

#### Scenario: 纯英文消息估算
- **WHEN** 消息 "Hello world" (11 chars)
- **THEN** estimated tokens ≈ ceil(11 / 3.5) = 4 tokens

#### Scenario: 纯中文消息估算
- **WHEN** 消息 "请总结文档内容" (7 chars)
- **THEN** estimated tokens ≈ ceil(7 / 3.5) = 2 tokens

#### Scenario: 每条消息额外开销
- **WHEN** 计算总 token 数
- **THEN** 每条消息增加 4 tokens 的系统开销（role label + separator）

### Requirement: 集成点
截断应在 chat route 调用 `streamText` 之前执行。

#### Scenario: Chat API 流程
- **WHEN** 用户发送消息到 `/api/chat`
- **THEN** 流程: auth → session CRUD → save user message → RAG search → build prompt → truncateMessages → streamText
