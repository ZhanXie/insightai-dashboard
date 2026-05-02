# InsightAI Dashboard

> A modern full-stack AI dashboard with RAG (Retrieval-Augmented Generation) chat, document management, and advanced analytics

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat&logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

## ✨ Features

- **🤖 AI-Powered Chat**: RAG-based conversations with your documents using pgvector
- **📁 Document Management**: Upload, process, and manage various file types (PDF, DOCX, TXT)
- **📈 Advanced Analytics**: Visualize usage data with interactive charts and insights
- **🔐 Secure Authentication**: Email/password authentication with NextAuth.js
- **🎨 Modern UI**: Clean, responsive design built with shadcn/ui components
- **⚡ Real-time Processing**: Background document processing with vector embeddings
- **🐳 Docker Support**: Containerized development with PostgreSQL + pgvector

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (optional, for local database)
- AI API Key (OpenAI or compatible)

### One-command Setup

```bash
# Clone and setup with Docker database
npm run setup

# Or for a complete fresh start
npm run reset
```

### Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (use Docker or external)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insightai"

# AI Provider (OpenAI or compatible)
AI_API_KEY="your-openai-api-key"
AI_BASE_URL="https://api.openai.com/v1"  # Optional for other providers

# Authentication
AUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External database
# DATABASE_URL="your-production-database-url"
```

### Start Development

```bash
# Standard development (requires external database)
npm run dev

# Development with Docker database
npm run dev:with-db

# Complete Docker setup + development
npm run dev:up

# Clean development (reset database)
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
insightai-dashboard/
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # AI chat API
│   │   ├── documents/     # Document management API
│   │   └── register/      # User registration
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── chat/          # Chat interface
│   │   ├── documents/     # Document management
│   │   └── layout.tsx     # Dashboard layout
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components (shadcn)
│   ├── Charts.tsx         # Analytics charts
│   ├── ChatSidebar.tsx    # Chat sidebar component
│   ├── DeleteDocumentButton.tsx
│   ├── FileUpload.tsx     # Document upload component
│   └── LogoutButton.tsx
├── lib/                   # Utilities and libraries
│   ├── analytics/         # Analytics utilities
│   ├── auth/              # Authentication utilities
│   ├── chat/              # Chat functionality
│   ├── documents/         # Document processing
│   ├── http/              # HTTP utilities
│   ├── shared/            # Shared utilities
│   ├── ai.ts              # AI integration
│   ├── auth-guard.ts      # Route protection
│   ├── document-processor.ts
│   ├── env.ts             # Environment validation
│   ├── prisma.ts          # Database client
│   ├── utils.ts           # General utilities
│   └── vector-search.ts   # Vector search
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema with pgvector
├── types/                 # TypeScript type definitions
│   └── next-auth.d.ts     # NextAuth type extensions
├── openspec/              # OpenSpec documentation
└── public/                # Static assets
```

## 🧠 RAG System Architecture

The RAG (Retrieval-Augmented Generation) system enables AI-powered chat with your documents.

### How It Works

```
User Query → Query Rewrite → Hybrid Search → Context Building → LLM Response
                   ↓              ↓               ↓
            LLM Enhancement   Vector + BM25   Ranking & Filter
```

### Key Features

- **Hybrid Search**: Combines vector similarity (pgvector) with BM25 keyword search
- **Dynamic Top-K**: Adjusts retrieval count based on query complexity
- **MMR Reranking**: Maximal Marginal Relevance for diverse results
- **Markdown-aware Chunking**: Preserves document structure with header awareness
- **Query Rewrite**: Uses LLM to expand short/vague queries with conversation history
- **Multi-doc Synthesis**: Detects cross-document questions and synthesizes information

### Document Processing Pipeline

```
Upload → Text Extraction → Chunking → Embedding → Vector Storage
         (PDF/DOCX/TXT)   (800-1500 chars) (text-embedding-v4) (pgvector)
```

### Search Pipeline

```
Query → Embedding → Vector Search → Keyword Search → RRF Fusion → MMR → Context
                  ↓                                    ↓
            top-K results                      Reciprocal Rank Fusion
```

### Configuration

The system automatically optimizes retrieval based on:
- Query length and complexity
- Number of available documents
- Conversation context

## 🛠️ Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM + pgvector
- **Authentication**: NextAuth.js with email/password
- **AI Integration**: Vercel AI SDK with OpenAI
- **Charts**: Recharts for data visualization
- **File Processing**: PDF, DOCX, and text processing
- **Deployment**: Vercel + Docker support

## 📦 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run dev:with-db      # Dev server with Docker database
npm run dev:clean        # Reset DB and start dev server
npm run dev:up           # Full Docker setup + development
```

### Database Management
```bash
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Deploy migrations
npm run db:reset         # Reset database (force)
npm run db:studio        # Open Prisma Studio
npm run db:status        # Check migration status
npm run db:deploy        # Generate + deploy migrations
```

### Testing & Quality
```bash
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage
npm run lint             # Run ESLint with auto-fix
npm run typecheck        # TypeScript type checking
npm run check            # Full code quality check
npm run check:ci         # CI-friendly code check
```

### Build & Deployment
```bash
npm run build            # Production build
npm run build:prod       # Production build with NODE_ENV
npm run build:analyze    # Build with bundle analysis
npm run start            # Start production server
npm run deploy           # Full deployment pipeline
npm run preview          # Build + start for preview
```

### Docker Management
```bash
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:restart   # Restart Docker services
npm run docker:logs      # View Docker logs
```

### Utilities
```bash
npm run setup            # Install + generate + push DB
npm run reset            # Complete environment reset
npm run clean            # Clean cache files
npm run clean:all        # Complete clean (node_modules)
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run audit            # Security audit
npm run ci               # CI/CD pipeline simulation
```

## 📊 Core Features

### AI Chat with RAG
- Upload documents and chat with AI about their content
- Real-time document processing with vector embeddings
- Context-aware responses based on your documents
- Support for multiple document formats

### Document Management
- Upload PDF, DOCX, and text files
- Automatic chunking and vector embedding
- Document status tracking (pending, processing, ready, error)
- File metadata and statistics

### Analytics Dashboard
- Usage statistics and metrics
- Interactive charts and visualizations
- Document processing analytics
- User activity tracking

### Authentication
- Email/password authentication
- Protected routes and API endpoints
- Session management with NextAuth.js
- Secure password hashing

## 🚢 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your production PostgreSQL URL
   - `AI_API_KEY`: Your OpenAI API key
   - `AUTH_SECRET`: Secure random secret
   - `NEXTAUTH_URL`: Your production domain
3. Deploy automatically on push to main branch

### Docker Deployment
```bash
# Production deployment with Docker
npm run build:prod
docker-compose up -d

# Or use the included script
npm run deploy
```

### Environment Variables for Production
```env
# Required
DATABASE_URL=your-production-database-url
AI_API_KEY=your-ai-provider-api-key
AUTH_SECRET=your-secure-secret
NEXTAUTH_URL=https://your-domain.com

# Optional
NODE_ENV=production
ENABLE_ANALYTICS=true
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section below
2. Search existing GitHub Issues
3. Create a new issue with detailed information

## 🔍 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check if database server is running
- Run `npm run db:status` to check migrations

**Authentication Problems**
- Ensure `AUTH_SECRET` is set and valid
- Check `NEXTAUTH_URL` matches your domain

**Build Failures**
- Run `npm run clean:all` and reinstall
- Check TypeScript errors with `npm run typecheck`

**Docker Issues**
- Ensure Docker is running
- Check ports are not already in use
- Run `npm run docker:logs` for detailed errors

### Performance Tips

- Use `npm run build:analyze` to identify large bundles
- Enable compression in production
- Use CDN for static assets
- Implement database indexing for large datasets

## 📈 Monitoring

For production monitoring:
- Enable logging with `NODE_ENV=production`
- Set up error tracking (Sentry, etc.)
- Monitor database performance
- Track AI API usage and costs

---

## 🌐 Localization

This project supports multiple languages. Check out the Chinese version: [README.zh-CN.md](README.zh-CN.md)