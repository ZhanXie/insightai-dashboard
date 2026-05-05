## 1. 数据库模型扩展

- [x] 1.1 扩展 Prisma schema：添加 Project 模型（id, userId, name, description, color, timestamps）
- [x] 1.2 扩展 Prisma schema：添加 Template 模型（id, name, slug, description, category, structure, prompts, isPublic, usageCount）
- [x] 1.3 扩展 Prisma schema：添加 Report 模型（id, userId, projectId, templateId, title, topic, status, outline, content, tokensUsed, timestamps）
- [x] 1.4 扩展 Prisma schema：添加 Citation 模型（id, reportId, type, sourceId, title, url, snippet, position）
- [x] 1.5 扩展 Prisma schema：添加 Subscription 模型（id, userId, stripeCustomerId, stripeSubscriptionId, stripePriceId, plan, status, currentPeriodEnd, cancelAtPeriodEnd）
- [x] 1.6 扩展 Prisma schema：添加 UsageLog 模型（id, userId, type, action, tokensUsed, metadata, timestamp）
- [x] 1.7 修改 Document 模型：添加 projectId 可选字段
- [x] 1.8 修改 User 模型：添加 projects, reports, subscription, usageLogs 关联
- [x] 1.9 创建数据库迁移：`prisma migrate dev --name add_insightforge_models`
- [x] 1.10 创建模板种子数据：编写 seed 脚本添加预设报告模板

## 2. 项目/知识库管理

- [x] 2.1 创建 Project 服务层：`lib/projects/project-service.ts`
- [x] 2.2 实现 createProject 函数
- [x] 2.3 实现 getProjects 函数（分页、统计信息）
- [x] 2.4 实现 getProjectById 函数
- [x] 2.5 实现 updateProject 函数
- [x] 2.6 实现 deleteProject 函数（级联处理文档和报告）
- [x] 2.7 创建 Project API 路由：`app/api/projects/route.ts`（GET, POST）
- [x] 2.8 创建 Project 详情 API：`app/api/projects/[id]/route.ts`（GET, PUT, DELETE）
- [x] 2.9 创建文档分配 API：`app/api/documents/[id]/assign/route.ts`

## 3. 网页搜索能力

- [x] 3.1 安装依赖：cheerio, duckduckgo-search（或自定义实现）
- [x] 3.2 创建搜索工具：`lib/agent/tools/web-search.ts`
- [x] 3.3 实现 webSearch 函数：DuckDuckGo 搜索
- [x] 3.4 创建抓取工具：`lib/agent/tools/scrape-url.ts`
- [x] 3.5 实现 scrapeUrl 函数：Cheerio 内容提取
- [x] 3.6 实现内容清洗：移除 HTML 标签、脚本、截断长内容
- [x] 3.7 实现搜索结果缓存（内存或 Redis）
- [x] 3.8 添加错误处理：超时、Rate Limit、robots.txt 检查

## 4. Agent 工作流框架

- [x] 4.1 创建 Agent 目录结构：`lib/agent/`
- [x] 4.2 定义工作流状态类型：`lib/agent/types.ts`（WorkflowState, WorkflowContext）
- [x] 4.3 定义 Agent 结果类型：AgentResult<T>
- [x] 4.4 创建状态机核心：`lib/agent/workflow.ts`
- [x] 4.5 实现 WorkflowContext 管理
- [x] 4.6 实现状态转换逻辑
- [x] 4.7 实现错误处理和状态回退

## 5. Agent 实现

- [x] 5.1 创建 Research Agent：`lib/agent/agents/research-agent.ts`
- [x] 5.2 实现 Research Agent：调用 webSearch 和 scrapeUrl 工具
- [x] 5.3 创建 Retrieval Agent：`lib/agent/agents/retrieval-agent.ts`
- [x] 5.4 实现 Retrieval Agent：调用现有 RAG 搜索（支持 project 过滤）
- [x] 5.5 创建 Analysis Agent：`lib/agent/agents/analysis-agent.ts`
- [x] 5.6 实现 Analysis Agent：洞察提取、图表数据生成
- [x] 5.7 创建 Writing Agent：`lib/agent/agents/writing-agent.ts`
- [x] 5.8 实现 Writing Agent：结构化报告生成（generateObject + Zod）
- [x] 5.9 定义报告 Zod schema：`lib/agent/schemas/report-schema.ts`
- [x] 5.10 实现引用追踪：从生成内容中提取和记录引用

## 6. 报告生成 API

- [x] 6.1 创建 Report 服务层：`lib/reports/report-service.ts`
- [x] 6.2 实现 createReport 函数（创建草稿）
- [x] 6.3 实现 getReports 函数（分页、过滤）
- [x] 6.4 实现 getReportById 函数
- [x] 6.5 实现 deleteReport 函数
- [x] 6.6 创建报告 API 路由：`app/api/reports/route.ts`（GET, POST）
- [x] 6.7 创建报告详情 API：`app/api/reports/[id]/route.ts`（GET, DELETE）
- [x] 6.8 创建生成 API：`app/api/reports/[id]/generate/route.ts`（POST）
- [x] 6.9 实现流式状态响应：SSE 或 Data Stream
- [x] 6.10 创建 Citation 服务：`lib/reports/citation-service.ts`

## 7. 报告模板系统

- [x] 7.1 创建模板服务：`lib/templates/template-service.ts`
- [x] 7.2 实现 getTemplates 函数（分类过滤）
- [x] 7.3 实现 getTemplateBySlug 函数
- [x] 7.4 创建模板 API：`app/api/templates/route.ts`（GET）
- [x] 7.5 编写预设模板数据：
  - 商业类：market-research, competitive-analysis, business-proposal, industry-analysis
  - 学术类：literature-review, research-summary, thesis-outline
  - 技术类：product-requirements, technical-review, project-proposal
  - 通用类：general-report, meeting-summary, learning-notes
- [x] 7.6 定义模板 JSON schema（structure, prompts）

## 8. 报告导出功能

- [ ] 8.1 安装依赖：docx, @react-pdf/renderer
- [x] 8.2 创建导出服务：`lib/export/export-service.ts`
- [x] 8.3 实现 Markdown 导出：`lib/export/markdown-export.ts`
- [x] 8.4 实现 Word 导出：`lib/export/word-export.ts`（使用 docx 库）
- [ ] 8.5 实现 PDF 导出：`lib/export/pdf-export.ts`（使用 @react-pdf/renderer）
- [x] 8.6 创建导出 API：`app/api/reports/[id]/export/route.ts`
- [x] 8.7 实现文件名生成逻辑：`{title}-{date}.{extension}`

## 9. Stripe 订阅系统

- [ ] 9.1 安装 Stripe SDK：`npm install stripe`
- [ ] 9.2 添加环境变量：STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_*
- [x] 9.3 创建 Stripe 客户端：`lib/stripe/client.ts`
- [x] 9.4 创建订阅服务：`lib/stripe/subscription-service.ts`
- [x] 9.5 实现 createCheckoutSession 函数
- [x] 9.6 实现 getSubscriptionStatus 函数
- [x] 9.7 实现 cancelSubscription 函数
- [x] 9.8 创建 Checkout API：`app/api/stripe/checkout/route.ts`
- [x] 9.9 创建 Webhook API：`app/api/stripe/webhook/route.ts`
- [x] 9.10 实现签名验证
- [x] 9.11 处理 webhook 事件：checkout.session.completed, subscription.updated, subscription.deleted
- [x] 9.12 创建订阅状态 API：`app/api/stripe/subscription/route.ts`

## 10. 用量统计系统

- [x] 10.1 创建用量服务：`lib/usage/usage-service.ts`
- [x] 10.2 实现 recordUsage 函数
- [x] 10.3 实现 getUsageStats 函数（当前周期统计）
- [x] 10.4 实现 getUsageHistory 函数（历史记录）
- [x] 10.5 实现 checkUsageLimit 函数（订阅计划限制检查）
- [x] 10.6 创建用量 API：`app/api/usage/route.ts`
- [x] 10.7 在报告生成完成时记录用量
- [x] 10.8 在聊天对话时记录用量

## 11. 前端：项目页面

- [x] 11.1 创建项目列表页面：`app/dashboard/projects/page.tsx`
- [x] 11.2 创建项目卡片组件：`components/ProjectCard.tsx`
- [x] 11.3 创建新建项目对话框：`components/CreateProjectDialog.tsx`
- [x] 11.4 创建项目详情页面：`app/dashboard/projects/[id]/page.tsx`
- [x] 11.5 创建项目统计组件：`components/ProjectStats.tsx`
- [x] 11.6 实现文档分配到项目的 UI

## 12. 前端：报告页面

- [x] 12.1 创建报告列表页面：`app/dashboard/reports/page.tsx`
- [x] 12.2 创建新建报告对话框：`components/CreateReportDialog.tsx`（选择模板、主题、项目）
- [x] 12.3 创建报告详情页面：`app/dashboard/reports/[id]/page.tsx`
- [x] 12.4 创建报告进度组件：`components/ReportProgress.tsx`（流式状态展示）
- [x] 12.5 创建报告预览组件：`components/ReportPreview.tsx`（Markdown 渲染）
- [x] 12.6 创建报告章节组件：`components/ReportSection.tsx`
- [x] 12.7 创建引用列表组件：`components/CitationList.tsx`
- [x] 12.8 创建导出按钮组件：`components/ExportButton.tsx`
- [x] 12.9 实现报告编辑功能（可选：修改标题、内容）

## 13. 前端：订阅页面

- [x] 13.1 创建设置页面：`app/dashboard/settings/page.tsx`
- [x] 13.2 创建订阅计划展示：`components/SubscriptionPlans.tsx`
- [x] 13.3 创建当前订阅状态卡片：`components/CurrentSubscription.tsx`
- [x] 13.4 创建用量统计展示：`components/UsageOverview.tsx`
- [x] 13.5 创建取消订阅确认对话框：`components/CancelSubscriptionDialog.tsx`

## 14. 前端：导航更新

- [x] 14.1 更新导航栏：添加 Projects、Reports、Settings 入口
- [x] 14.2 更新品牌名称：InsightAI → InsightForge
- [x] 14.3 更新首页：展示新功能亮点
- [x] 14.4 更新仪表盘统计：添加报告相关统计

## 15. 测试与文档

- [ ] 15.1 编写 Agent 工作流单元测试
- [ ] 15.2 编写 API 集成测试
- [ ] 15.3 编写 Stripe webhook 本地测试脚本
- [x] 15.4 更新 README.md：新功能说明
- [x] 15.5 更新环境变量文档：`.env.example`
- [ ] 15.6 添加 API 文档注释

## 16. 部署准备

- [ ] 16.1 配置 Stripe 生产环境密钥
- [ ] 16.2 设置 Stripe webhook 生产 URL
- [ ] 16.3 运行生产构建测试：`npm run build`
- [ ] 16.4 验证数据库迁移在生产环境
