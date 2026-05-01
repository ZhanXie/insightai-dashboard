# Environment Validation Specification

## Purpose
在应用启动时一次性校验所有必需的环境变量，快速失败而非在运行时静默崩溃。

## Requirements

### Requirement: 必需环境变量清单
系统 SHALL 在启动时验证以下环境变量全部存在且格式正确：

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `DIRECT_DATABASE_URL` | ❌ | 直接连接 URL（用于 Prisma migrate） |
| `OPENAI_COMPATIBLE_BASE_URL` | ✅ | DashScope OpenAI-compatible API 端点 |
| `OPENAI_COMPATIBLE_API_KEY` | ✅ | API 密钥（非空） |
| `OPENAI_CHAT_MODEL` | ❌ | 聊天模型名称（默认 qwen3.6-plus-2026-04-02） |
| `OPENAI_EMBEDDING_MODEL` | ❌ | 嵌入模型名称（默认 text-embedding-v4） |
| `AUTH_SECRET` | ✅ | Auth.js 加密密钥（长度 >= 16） |
| `NEXTAUTH_URL` | ❌ | 应用 URL（开发环境 http://localhost:3000） |

#### Scenario: 缺少 DATABASE_URL
- **WHEN** `DATABASE_URL` 未设置
- **THEN** 应用启动时抛出明确错误："DATABASE_URL is required"

#### Scenario: AUTH_SECRET 过短
- **WHEN** `AUTH_SECRET` 存在但长度 < 16
- **THEN** 抛出错误："AUTH_SECRET must be at least 16 characters"

#### Scenario: OPENAI_COMPATIBLE_API_KEY 为空
- **WHEN** `OPENAI_COMPATIBLE_API_KEY=""`
- **THEN** 抛出错误："OPENAI_COMPATIBLE_API_KEY cannot be empty"

#### Scenario: 所有变量有效
- **WHEN** 所有必需变量都存在且通过校验
- **THEN** 启动流程正常继续，无额外输出

### Requirement: 导入时机
`lib/env.ts` SHALL 被第一个导入的模块在文件顶部引入，确保校验在任何其他代码执行前完成。

#### Scenario: lib/prisma.ts 导入 env
- **WHEN** `lib/prisma.ts` 的 `import "@/lib/env"`
- **THEN** 数据库 URL 校验在 PrismaClient 实例化之前运行

#### Scenario: lib/ai.ts 导入 env
- **WHEN** `lib/ai.ts` 的 `import "@/lib/env"`
- **THEN** API Key 校验在 createOpenAI 调用之前运行

### Requirement: 开发/生产一致
校验逻辑在开发环境和生产环境中相同，不跳过任何检查。

#### Scenario: 开发环境
- **WHEN** `NODE_ENV=development`
- **THEN** 全部校验仍然执行

#### Scenario: 生产环境
- **WHEN** `NODE_ENV=production`
- **THEN** 全部校验仍然执行
