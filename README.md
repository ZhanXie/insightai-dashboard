# AI Dashboard / AI 智能仪表盘

> A full-stack AI dashboard with RAG (Retrieval-Augmented Generation) knowledge base chat and data visualization.
> 一个全栈 AI 仪表盘，具备 RAG（检索增强生成）知识库聊天和数据可视化功能。

---

## Tech Stack / 技术栈

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | Auth.js v5 (next-auth@5) |
| Database | Supabase PostgreSQL + Prisma ORM 6 + pgvector |
| AI | Vercel AI SDK 4 + Tencent Hunyuan (OpenAI-compatible API) |
| Charts | Recharts 3 |
| Deployment | Vercel Hobby (free) |

## Features / 功能特性

- **User Authentication** — Register, login, session management with Auth.js v5
- **Document Upload** — Upload PDF/TXT/MD/DOCX files (up to 50MB), auto text extraction, chunking, and vector embedding
- **RAG Chat** — AI chat powered by vector similarity search, streaming responses via Server-Sent Events
- **Data Visualization** — Dashboard with Recharts: document trends, chat activity, format distribution
- **User Data Isolation** — All queries scoped by user ID, strict data separation
- **Zero-Cost Deployment** — Vercel Hobby + Supabase free tier

---

## Quick Start / 快速开始

### Prerequisites / 前置要求

- Node.js 18+
- PostgreSQL database (recommended: [Supabase](https://supabase.com/))
- Tencent Hunyuan API Key ([Get one here](https://console.cloud.tencent.com/hunyuan/api-key))

### 1. Clone & Install / 克隆并安装

```bash
git clone <your-repo-url>
cd insightai-dashboard
npm run setup
```

`npm run setup` runs `npm install` + `prisma generate` + `prisma db push` in one command.

### 2. Configure Environment / 配置环境变量

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres?schema=public"

# Tencent Hunyuan AI API Key
HUNYUAN_API_KEY="YOUR_HUNYUAN_API_KEY"

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-random-secret-here"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Enable pgvector / 启用 pgvector 扩展

In your Supabase dashboard → **Database** → **Extensions**, enable the `pgvector` extension.

Or via SQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Push Database Schema / 推送数据库 Schema

```bash
npm run db:push
```

### 5. Start Development Server / 启动开发服务器

```bash
npm run dev          # standard dev server
npm run dev:turbo    # faster with Turbopack
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts / 可用脚本

### Development / 开发

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint and auto-fix |
| `npm run typecheck` | TypeScript type check (no emit) |

### Database / 数据库

| Command | Description |
|---------|------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database (development) |
| `npm run db:migrate` | Deploy migrations to production |
| `npm run db:deploy` | One-click deploy: generate + migrate |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run setup` | Install + generate + push (one-time setup) |

### Production Deploy / 生产部署

```bash
npm run build
npm run db:deploy
npm start
```

---

## Project Structure / 项目结构

```
insightai-dashboard/
├── app/                              # Next.js App Router
│   ├── api/                          # API Route Handlers
│   │   ├── auth/[...nextauth]/       # Auth.js v5 authentication
│   │   ├── chat/                     # RAG chat + session management
│   │   ├── documents/                # Document CRUD + upload
│   │   └── register/                 # User registration
│   ├── actions/                      # Server Actions
│   ├── login/                        # Login page
│   ├── register/                     # Registration page
│   └── dashboard/                    # Protected dashboard pages
│       ├── chat/                     # AI chat interface
│       ├── documents/                # Document management
│       └── analytics/                # Data visualization
├── components/                       # Reusable React components
│   ├── FileUpload.tsx                # Drag & drop file uploader
│   ├── ChatSidebar.tsx               # Chat session sidebar
│   ├── Charts.tsx                    # Recharts chart components
│   ├── StatCard.tsx                  # Dashboard stat cards
│   ├── LogoutButton.tsx              # Logout button
│   └── DeleteDocumentButton.tsx      # Document delete button
├── lib/                              # Utility libraries
│   ├── prisma.ts                     # Prisma client singleton
│   ├── ai.ts                         # AI model configuration
│   ├── document-processor.ts         # Text extraction & chunking
│   └── vector-search.ts              # pgvector similarity search
├── prisma/
│   └── schema.prisma                 # Database schema (5 models + pgvector)
├── types/
│   └── next-auth.d.ts                # Auth.js type extensions
├── middleware.ts                     # Route protection middleware
├── .env.example                      # Environment variables template
└── .env.local                        # Local env (gitignored)
```

---

## Architecture / 架构设计

### RAG Flow / RAG 流程

```
Upload Document
    │
    ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Extract Text   │────▶│  Chunk Text       │────▶│  Generate Embed- │
│  (pdf-parse,    │     │  (500-1000 tokens │     │  dings (Hunyuan) │
│   mammoth)      │     │   + 100 overlap)  │     │                  │
└─────────────────┘     └──────────────────┘     └─────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Store in Post-  │
                                                  │  gres (pgvector) │
                                                  └──────────────────┘

Chat Query
    │
    ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Generate Query │────▶│  Vector Similar-  │────▶│  Build Augmented │
│  Embedding      │     │  ity Search (Top-5│     │  Prompt + Stream │
│                 │     │   user-scoped)    │     │  AI Response     │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### Data Models / 数据模型

```
User ──┬── Document ── Chunk (with pgvector embedding)
       │
       └── ChatSession ── Message (user/assistant)
```

### API Route Handler vs Server Action

| Scenario | Choice | Reason |
|----------|--------|--------|
| Streaming AI response | **API Handler** | Only API routes support SSE streaming |
| Form submission (login/register) | **Server Action** | Progressive enhancement, auto-serialization |
| Server-side data fetching | **Server Action** | Best performance, no HTTP round-trip |
| RESTful CRUD operations | **API Handler** | Clear HTTP semantics |
| External/third-party calls | **API Handler** | Only externally accessible endpoints |

---

## Deployment / 部署

### Vercel + Supabase

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Set environment variables:
   - `DATABASE_URL` (Supabase connection string)
   - `HUNYUAN_API_KEY`
   - `AUTH_SECRET` (generate with `openssl rand -base64 32`)
4. Deploy!

### Production Database Migration

Deploy database to production:

```bash
npm run db:deploy
# Equivalent to: npx prisma generate && npx prisma migrate deploy
```

⚠️ **Important**: 
- Use `db:deploy` for new production databases
- Use `db:push` only for local development

### Docker Deployment (Optional)

```bash
# Build and run with docker-compose
docker-compose -f docker-compose.yml up -d
```

Environment variables can be set in `.env` file or directly in docker-compose.

---

## Troubleshooting / 常见问题

### Build fails with pgvector errors
Make sure `pgvector` extension is enabled in your PostgreSQL database:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Auth.js session issues
- Ensure `AUTH_SECRET` is set in `.env.local`
- Regenerate the secret: `openssl rand -base64 32`
- Clear browser cookies and try again

### Document upload fails
- Check file size is under 50MB
- Verify supported formats: PDF, TXT, MD, DOCX
- Check Vercel serverless function timeout (Hobby tier: 10s limit)

### AI chat not returning results
- Verify `HUNYUAN_API_KEY` is correct
- Check that documents have status "ready"
- Review browser console for streaming errors

---

## License / 许可证

MIT
