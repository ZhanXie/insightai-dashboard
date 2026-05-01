# InsightAI 仪表盘

> 现代化的全栈 AI 仪表盘，具备 RAG 聊天、文档管理和高级分析功能

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat&logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

## ✨ 功能特性

- **🤖 AI驱动聊天**: 基于 RAG 的文档对话，使用 pgvector
- **📁 文档管理**: 上传、处理和管理多种文件类型 (PDF, DOCX, TXT)
- **📈 高级分析**: 交互式图表和数据洞察可视化
- **🔐 安全认证**: 基于 NextAuth.js 的邮箱/密码认证
- **🎨 现代化UI**: 基于 shadcn/ui 组件的简洁响应式设计
- **⚡ 实时处理**: 后台文档处理和向量嵌入
- **🐳 Docker支持**: 容器化开发，支持 PostgreSQL + pgvector

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Docker (可选，用于本地数据库)
- AI API 密钥 (OpenAI 或兼容API)

### 一键设置

```bash
# 使用 Docker 数据库克隆和设置
npm run setup

# 或完全重新开始
npm run reset
```

### 环境配置

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 数据库 (使用 Docker 或外部数据库)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insightai"

# AI 提供商 (OpenAI 或兼容API)
AI_API_KEY="your-openai-api-key"
AI_BASE_URL="https://api.openai.com/v1"  # 其他提供商可选

# 身份验证
AUTH_SECRET="使用命令生成: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# 可选: 外部数据库
# DATABASE_URL="your-production-database-url"
```

### 启动开发

```bash
# 标准开发 (需要外部数据库)
npm run dev

# 使用 Docker 数据库开发
npm run dev:with-db

# 完整 Docker 设置 + 开发
npm run dev:up

# 干净开发 (重置数据库)
npm run dev:clean
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 🏗️ 项目结构

```
insightai-dashboard/
├── app/                    # Next.js App Router
│   ├── actions/           # 服务器操作
│   ├── api/               # API 路由
│   │   ├── auth/          # 身份验证端点
│   │   ├── chat/          # AI 聊天 API
│   │   ├── documents/     # 文档管理 API
│   │   └── register/      # 用户注册
│   ├── dashboard/         # 受保护的仪表盘路由
│   │   ├── analytics/     # 分析仪表盘
│   │   ├── chat/          # 聊天界面
│   │   ├── documents/     # 文档管理
│   │   └── layout.tsx     # 仪表盘布局
│   ├── login/             # 登录页面
│   ├── register/          # 注册页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/                # 可复用 UI 组件 (shadcn)
│   ├── Charts.tsx         # 分析图表
│   ├── ChatSidebar.tsx    # 聊天侧边栏组件
│   ├── DeleteDocumentButton.tsx
│   ├── FileUpload.tsx     # 文档上传组件
│   └── LogoutButton.tsx
├── lib/                   # 工具和库
│   ├── analytics/         # 分析工具
│   ├── auth/              # 身份验证工具
│   ├── chat/              # 聊天功能
│   ├── documents/         # 文档处理
│   ├── http/              # HTTP 工具
│   ├── shared/            # 共享工具
│   ├── ai.ts              # AI 集成
│   ├── auth-guard.ts      # 路由保护
│   ├── document-processor.ts
│   ├── env.ts             # 环境验证
│   ├── prisma.ts          # 数据库客户端
│   ├── utils.ts           # 通用工具
│   └── vector-search.ts   # 向量搜索
├── prisma/                # 数据库 schema
│   └── schema.prisma      # 包含 pgvector 的 Prisma schema
├── types/                 # TypeScript 类型定义
│   └── next-auth.d.ts     # NextAuth 类型扩展
├── openspec/              # OpenSpec 文档
└── public/                # 静态资源
```

## 🛠️ 技术栈

- **框架**: Next.js 16+ (App Router)
- **语言**: TypeScript 5+
- **样式**: Tailwind CSS 4 + shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM + pgvector
- **身份验证**: NextAuth.js 邮箱/密码认证
- **AI集成**: Vercel AI SDK + OpenAI
- **图表**: Recharts 数据可视化
- **文件处理**: PDF、DOCX 和文本处理
- **部署**: Vercel + Docker 支持

## 📦 可用脚本

### 开发
```bash
npm run dev              # 启动开发服务器
npm run dev:with-db      # 带 Docker 数据库的开发服务器
npm run dev:clean        # 重置数据库并启动开发
npm run dev:up           # 完整 Docker 设置 + 开发
```

### 数据库管理
```bash
npm run db:generate      # 生成 Prisma 客户端
npm run db:push          # 推送 schema 到数据库
npm run db:migrate       # 部署迁移
npm run db:reset         # 重置数据库 (强制)
npm run db:studio        # 打开 Prisma Studio
npm run db:status        # 检查迁移状态
npm run db:deploy        # 生成 + 部署迁移
```

### 测试和质量
```bash
npm run test             # 运行 Jest 测试
npm run test:watch       # 监听模式运行测试
npm run test:coverage    # 生成测试覆盖率
npm run lint             # 运行 ESLint 并自动修复
npm run typecheck        # TypeScript 类型检查
npm run check            # 完整代码质量检查
npm run check:ci         # CI 友好的代码检查
```

### 构建和部署
```bash
npm run build            # 生产构建
npm run build:prod       # 生产环境构建
npm run build:analyze    # 构建包分析
npm run start            # 启动生产服务器
npm run deploy           # 完整部署流程
npm run preview          # 构建 + 预览
```

### Docker 管理
```bash
npm run docker:up        # 启动 Docker 服务
npm run docker:down      # 停止 Docker 服务
npm run docker:restart   # 重启 Docker 服务
npm run docker:logs      # 查看 Docker 日志
```

### 实用工具
```bash
npm run setup            # 安装 + 生成 + 推送数据库
npm run reset            # 完全环境重置
npm run clean            # 清理缓存文件
npm run clean:all        # 完全清理 (node_modules)
npm run format           # Prettier 代码格式化
npm run format:check     # 检查代码格式
npm run audit            # 安全审计
npm run ci               # CI/CD 流水线模拟
```

## 📊 核心功能

### AI 聊天与 RAG
- 上传文档并与 AI 进行内容对话
- 实时文档处理和向量嵌入
- 基于文档的上下文感知响应
- 支持多种文档格式

### 文档管理
- 上传 PDF、DOCX 和文本文件
- 自动分块和向量嵌入
- 文档状态跟踪 (pending, processing, ready, error)
- 文件元数据和统计信息

### 分析仪表盘
- 使用统计和指标
- 交互式图表和可视化
- 文档处理分析
- 用户活动跟踪

### 身份验证
- 邮箱/密码认证
- 受保护的路由和 API 端点
- NextAuth.js 会话管理
- 安全密码哈希

## 🚢 部署

### Vercel 部署
1. 将 GitHub 仓库连接到 Vercel
2. 在 Vercel 仪表板中设置环境变量：
   - `DATABASE_URL`: 生产环境 PostgreSQL URL
   - `AI_API_KEY`: OpenAI API 密钥
   - `AUTH_SECRET`: 安全随机密钥
   - `NEXTAUTH_URL`: 生产环境域名
3. 推送到 main 分支时自动部署

### Docker 部署
```bash
# 使用 Docker 生产部署
npm run build:prod
docker-compose up -d

# 或使用内置脚本
npm run deploy
```

### 生产环境变量
```env
# 必需
DATABASE_URL=生产数据库URL
AI_API_KEY=AI提供商API密钥
AUTH_SECRET=安全密钥
NEXTAUTH_URL=https://你的域名.com

# 可选
NODE_ENV=production
ENABLE_ANALYTICS=true
```

## 🧪 测试

运行测试套件：

```bash
# 运行所有测试
npm run test

# 运行带覆盖率的测试
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/精彩功能`
3. 提交更改: `git commit -m '添加精彩功能'`
4. 推送到分支: `git push origin feature/精彩功能`
5. 创建 Pull Request

## 📝 许可证

本项目基于 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🆘 支持

如果遇到问题：

1. 查看下面的[故障排除](#-故障排除)部分
2. 搜索现有的 GitHub Issues
3. 创建新 issue 并提供详细信息

## 🔍 故障排除

### 常见问题

**数据库连接问题**
- 验证 `DATABASE_URL` 是否正确
- 检查数据库服务器是否运行
- 运行 `npm run db:status` 检查迁移状态

**身份验证问题**
- 确保 `AUTH_SECRET` 已设置且有效
- 检查 `NEXTAUTH_URL` 是否与域名匹配

**构建失败**
- 运行 `npm run clean:all` 并重新安装
- 使用 `npm run typecheck` 检查 TypeScript 错误

**Docker 问题**
- 确保 Docker 正在运行
- 检查端口是否已被占用
- 运行 `npm run docker:logs` 查看详细错误

### 性能提示

- 使用 `npm run build:analyze` 识别大包
- 在生产环境启用压缩
- 使用 CDN 处理静态资源
- 对大数据集实施数据库索引

## 📈 监控

生产环境监控：
- 使用 `NODE_ENV=production` 启用日志
- 设置错误跟踪 (Sentry 等)
- 监控数据库性能
- 跟踪 AI API 使用情况和成本

---

## 🌐 多语言支持

本项目支持多语言。查看英文版本: [README.md](README.md)