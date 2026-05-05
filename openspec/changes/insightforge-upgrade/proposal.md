## Why

InsightAI Dashboard 目前是一个文档问答工具，用户上传文档后进行 RAG 对话。但研究员、分析师等目标用户需要一个完整的"研究到报告"工作流：从主题研究、信息收集、洞察提炼到专业报告输出。现有的单一问答模式无法满足这一需求。

InsightForge 升级将平台定位从"文档问答工具"升级为"AI 智能研究与专业报告生成平台"，通过 Multi-Agent 工作流自动化研究报告的生成过程，同时引入 SaaS 订阅模式支持商业化。

## What Changes

### 新增功能

- **项目/知识库管理**：文档按项目分组，支持多知识库管理，报告关联到具体项目
- **Multi-Agent 研究工作流**：轻量状态机实现 Research → Retrieval → Analysis → Writing 四阶段流程
  - Research Agent：网页搜索、内容抓取、信息收集
  - Retrieval Agent：复用现有 RAG 能力进行文档检索
  - Analysis Agent：洞察提炼、图表数据生成
  - Writing Agent：结构化报告生成
- **报告生成系统**：基于模板的结构化报告输出，支持多种报告类型
- **报告导出**：支持导出 PDF、Word、Markdown 格式
- **Stripe 订阅系统**：完整的订阅流程（Checkout + Webhook），Free/Pro/Team 三档
- **用量统计**：Token 消耗、报告数量等使用记录

### 功能保留与增强

- **文档上传**：保留现有功能，增加"归属项目"字段
- **RAG 聊天**：保留独立入口，同时作为 Agent 工作流的检索能力
- **分析仪表盘**：增加报告相关统计和用量统计
- **视频转录**：保留可选功能，转录内容可纳入知识库

### 架构变更

- **数据模型扩展**：新增 Project、Report、Template、Citation、Subscription、UsageLog 模型
- **API 扩展**：新增 `/api/reports`、`/api/agent`、`/api/stripe` 路由
- **前端路由**：新增 `/dashboard/projects`、`/dashboard/reports`、`/dashboard/settings` 页面

## Capabilities

### New Capabilities

- `project-management`：项目/知识库的 CRUD 操作，文档分组管理
- `report-generation`：Multi-Agent 报告生成工作流，状态机驱动的四阶段流程
- `web-research`：网页搜索与内容抓取能力（DuckDuckGo + Cheerio）
- `report-templates`：报告模板系统，预设商业/学术/技术/通用四类模板
- `report-export`：报告导出功能（PDF/Word/Markdown）
- `stripe-subscription`：Stripe 订阅管理，Checkout + Webhook 集成
- `usage-tracking`：用户用量统计与展示

### Modified Capabilities

- `service-layer-documents`：Document 模型增加 `projectId` 字段，支持文档归属项目
- `service-layer-chat`：RAG 检索能力可被 Agent 工作流调用

## Impact

### 数据库迁移

- 新增表：`projects`、`reports`、`templates`、`citations`、`subscriptions`、`usage_logs`
- 修改表：`documents` 增加 `project_id` 字段
- 种子数据：预设报告模板

### API 变更

- 新增路由：
  - `POST /api/reports` - 创建报告
  - `GET /api/reports/:id` - 获取报告详情
  - `POST /api/reports/:id/generate` - 触发报告生成
  - `GET /api/reports/:id/export` - 导出报告
  - `POST /api/stripe/checkout` - 创建 Checkout Session
  - `POST /api/stripe/webhook` - Stripe Webhook
  - `GET /api/stripe/subscription` - 获取订阅状态

### 前端变更

- 新增页面：Projects、Reports、Settings（订阅管理）
- 修改布局：导航栏增加新入口
- 新增组件：报告生成进度展示、报告预览/编辑器、订阅计划选择

### 依赖新增

- `stripe` - Stripe SDK
- `cheerio` - HTML 解析
- `duckduckgo-search` 或自建搜索 - 网页搜索
- `@react-pdf/renderer` 或 `puppeteer` - PDF 生成
- `docx` - Word 文档生成
- `zod` - 结构化输出验证
