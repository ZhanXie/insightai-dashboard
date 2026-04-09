## 1. Project Setup & Dependencies

- [x] 1.1 Install core dependencies (latest versions): `next-auth@latest`, `@prisma/client@latest`, `prisma@latest`, `ai@latest`, `recharts@latest`
- [x] 1.2 Install supporting packages (latest): `pg@latest`, `@types/pg@latest`, `bcryptjs@latest`, `@types/bcryptjs@latest`
- [x] 1.3 Install document processing (latest): `pdf-parse@latest`, `mammoth@latest`
- [x] 1.4 Update Next.js and React to latest versions in package.json
- [x] 1.5 Initialize Prisma: `npx prisma init` and configure PostgreSQL connection
- [x] 1.6 Configure Auth.js v5 with Credentials provider using Server Action for login
- [x] 1.7 Set up environment variables template (.env.example) with DATABASE_URL, HUNYUAN_API_KEY, AUTH_SECRET

## 2. Database Schema & Migration

- [x] 2.1 Define Prisma schema: `User` model (id, email, password hash, name, createdAt)
- [x] 2.2 Define Prisma schema: `Document` model (id, userId, filename, filePath, fileSize, mimeType, status, chunkCount, createdAt)
- [x] 2.3 Define Prisma schema: `Chunk` model (id, documentId, content, position, embedding as pgvector)
- [x] 2.4 Define Prisma schema: `ChatSession` model (id, userId, title, createdAt, updatedAt)
- [x] 2.5 Define Prisma schema: `Message` model (id, sessionId, role, content, createdAt)
- [x] 2.6 Enable pgvector extension in Supabase and configure Prisma to use Vector type
- [x] 2.7 Run `prisma db push` to create all tables *(requires DATABASE_URL configured)*
- [x] 2.8 Create indexes on chunks(embedding) and foreign keys for query performance

## 3. Authentication Implementation

- [x] 3.1 Create Auth.js config file with Credentials provider using Server Action for authenticate function
- [x] 3.2 Create `/api/auth/[...nextauth]/route.ts` API Route Handler (required by Auth.js framework)
- [x] 3.3 Create `/login` page with email/password login form using Server Action for form submission
- [x] 3.4 Create `/register` page with email/password registration form using Server Action for form submission
- [x] 3.5 Implement Server Action for user registration with password hashing (bcrypt)
- [x] 3.6 Implement Server Action for user login authentication using Auth.js signIn
- [x] 3.7 Create auth middleware: protect routes by checking session in Server Components
- [x] 3.8 Create `/dashboard` layout with user info and logout button (Server Action for logout)
- [ ] 3.9 Test: register → login → access protected page → logout → verify redirect *(requires database connection)*

## 4. Document Upload Pipeline

- [x] 4.1 Create file upload UI component with drag-and-drop and file type/size validation (Client Component)
- [x] 4.2 Create `POST /api/documents/upload` API Route Handler to receive multipart file uploads
- [x] 4.3 Implement Server Action `processDocument` for text extraction (pdf-parse for PDF, mammoth for DOCX, fs for TXT/MD)
- [x] 4.4 Implement text chunking logic: 500-1000 tokens per chunk with 100 token overlap
- [x] 4.5 Configure Vercel AI SDK with OpenAI-compatible provider pointing to Hunyuan API (baseURL: https://api.hunyuan.cloud.tencent.com/v1)
- [x] 4.6 Implement Server Action for embedding generation: call Hunyuan /v1/embeddings for each chunk
- [x] 4.7 Implement batch insertion of chunks with pgvector embeddings into database
- [x] 4.8 Implement document status management: pending → processing → ready/error
- [x] 4.9 Create `GET /api/documents` API Route Handler returning paginated user document list
- [x] 4.10 Create `DELETE /api/documents/[id]` API Route Handler with ownership verification and cascade delete
- [x] 4.11 Create document list page using Server Component with Server Action for data fetching
- [ ] 4.12 Test: upload PDF → verify text extraction → verify chunking → verify embeddings → verify status update *(requires database + API keys)*

## 5. RAG Chat Implementation

- [x] 5.1 Create `POST /api/chat` API Route Handler using Vercel AI SDK streamText with Hunyuan model (must be API Handler for SSE streaming)
- [x] 5.2 Implement Server Action for vector similarity search: prisma.$queryRaw with `<->` operator, top-5, user-scoped
- [x] 5.3 Implement augmented prompt construction: system message + retrieved chunks with source labels + user question
- [x] 5.4 Implement Server Action for chat session creation and message storage (async after streaming begins)
- [x] 5.5 Create client-side chat interface using `useChat` hook (Client Component) with streaming display
- [x] 5.6 Create chat session sidebar/list using Server Component with Server Action for data fetching
- [x] 5.7 Implement Server Action for chat session loading and message history display
- [x] 5.8 Implement `DELETE /api/chat/sessions/[id]` API Route Handler with cascade delete
- [x] 5.9 Handle edge case: no documents uploaded → show informative message in chat UI
- [x] 5.10 Handle edge case: embedding API error → graceful error message in chat
- [ ] 5.11 Test: upload doc → ask question → verify correct RAG retrieval → verify streaming response → verify session saved *(requires database + API keys)*

## 6. Data Visualization Dashboard

- [x] 6.1 Create Server Actions for analytics data fetching: document stats, chat activity, format distribution
- [x] 6.2 Create dashboard main page using Server Component that calls analytics Server Actions
- [x] 6.3 Create dashboard summary cards: total documents, total chunks, total sessions, recent activity
- [x] 6.4 Implement "Documents Over Time" chart using Recharts (Client Component) with day/week/month toggle
- [x] 6.5 Implement "Chat Activity" bar chart (Client Component) showing last 30 days of messages
- [x] 6.6 Implement "Document Format Distribution" pie/donut chart (Client Component)
- [x] 6.7 Implement responsive layout for charts: desktop multi-column → tablet single-column
- [x] 6.8 Implement data refresh on page navigation and manual refresh button
- [x] 6.9 Handle empty state: show placeholder messages when no data exists
- [ ] 6.10 Test: upload multiple docs over different days → verify charts render correctly → verify responsive layout *(requires database + API keys)*

## 7. Polish & Testing

- [x] 7.1 Add loading states and skeleton screens for all async operations (Server Component Suspense + Client Component loading)
- [x] 7.2 Add error boundaries and user-friendly error messages throughout
- [ ] 7.3 Upload test documents (PDF, TXT, MD) and verify end-to-end RAG flow *(manual test - requires database + API keys)*
- [ ] 7.4 Test user isolation: verify User A cannot see User B's documents or chats *(manual test - requires database)*
- [ ] 7.5 Test file size limits: verify 50MB+ files are rejected *(manual test)*
- [ ] 7.6 Test unsupported file formats: verify proper error messages *(manual test)*
- [ ] 7.7 Verify Vercel deployment with correct environment variable configuration *(manual test - requires deployment)*
- [ ] 7.8 Performance test: measure upload-to-ready time for typical documents *(manual test - requires database + API keys)*
- [x] 7.9 Clean up TypeScript errors, ensure strict mode compliance, and verify all dependencies are at latest stable versions
