## Context

项目当前使用 Prisma 6.19.3，通过内置的 Rust 查询引擎连接 Supabase PostgreSQL。数据库连接、SSL 处理和连接池管理都由 Prisma 内部处理。

Prisma 7.x 移除了 Rust 引擎，改用纯 JavaScript 驱动适配器（`@prisma/adapter-pg` + `pg`）。这意味着我们需要自己管理数据库连接池和 SSL 配置。

项目部署在 Vercel Serverless（Hobby 免费层），数据库使用 Supabase Free Tier。

## Goals / Non-Goals

**Goals:**
- 将 Prisma 从 6.x 升级到 7.x，保持所有现有功能正常运行
- 正确配置 pg driver adapter 的连接池和 SSL
- 确保 `$queryRaw`（pgvector 向量搜索）正常工作
- 确保 `@auth/prisma-adapter` 正常工作
- 更新所有导入路径和 npm scripts

**Non-Goals:**
- 不做性能优化或连接池调优
- 不添加查询监控、日志或重试逻辑
- 不修改数据库 schema 或业务逻辑
- 不迁移其他依赖或重构代码

## Decisions

### D1: 使用 `@prisma/adapter-pg` + `pg` 作为驱动适配器

**选择：** `@prisma/adapter-pg` 配合 `pg` (node-postgres)

**理由：** Prisma 7 强制使用驱动适配器，项目使用 PostgreSQL，`pg` 是最成熟的 Node.js PostgreSQL 驱动。

### D2: 连接池配置

**选择：** `pg.Pool` 默认配置（`max: 10`），不做特殊调优

**理由：** 升级目标是"能正常运行"，不做额外优化。Supabase Free Tier 支持 60 个连接，Vercel Hobby 的并发实例数在合理范围内。如果后续出现连接问题再调整。

### D3: SSL 配置

**选择：** 生产环境启用 `ssl: { rejectUnauthorized: false }`，开发环境不启用 SSL

**理由：** Supabase 连接字符串通常包含 `?sslmode=require`。`pg` 库默认不验证自签名证书，而 Prisma 7 的 SSL 行为更严格。使用 `rejectUnauthorized: false` 确保与 Supabase 的连接正常工作。

### D4: Prisma Client 输出路径

**选择：** `output = "../generated/prisma"` （相对于 schema.prisma）

**理由：** Prisma 7 要求显式指定 `output` 路径。将生成的客户端放在项目根目录的 `generated/` 目录下，避免与 `node_modules` 混淆，也便于 gitignore。

### D5: `prisma.config.ts` 配置方式

**选择：** 创建 `prisma.config.ts`，使用 `defineConfig` 配置 schema 路径和数据源

**理由：** Prisma 7 推荐使用 `prisma.config.ts` 作为配置中心，替代 `.env` 中的数据库 URL 自动加载。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `$queryRaw` 的 tagged template 在 pg adapter 下行为不同 | 升级后测试 pgvector 向量搜索查询 |
| `@auth/prisma-adapter` 不兼容 Prisma 7 客户端 | 升级到最新版 `@auth/prisma-adapter`，如不兼容则需自定义 adapter |
| Vercel Serverless 冷启动时连接池重建延迟 | 暂不处理，如出现超时问题再优化连接池配置 |
| Supabase 连接数耗尽 | 当前规模下不太可能，监控后续使用情况 |
| ESM 导入路径问题 | tsconfig 已配置 `moduleResolution: "bundler"`，应无问题 |

## Migration Plan

1. 升级依赖（`prisma`、`@prisma/client`、`@auth/prisma-adapter`），安装新依赖（`@prisma/adapter-pg`、`pg`、`@types/pg`）
2. 更新 `prisma/schema.prisma` generator 配置
3. 创建 `prisma.config.ts`
4. 重写 `lib/prisma.ts` 客户端初始化
5. 更新所有导入路径
6. 调整 npm scripts
7. 运行 `prisma generate` 生成新客户端
8. 运行 `npm run build` 验证编译通过
9. 本地测试核心流程（登录、上传文档、RAG 聊天）

## Open Questions

- `@auth/prisma-adapter` 2.11.x 是否完全兼容 Prisma 7 客户端？需要在升级后验证。
