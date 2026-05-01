# prisma-driver-adapter Specification

## Purpose
TBD - created by archiving change upgrade-prisma-7. Update Purpose after archive.
## Requirements
### Requirement: 使用 pg 驱动适配器初始化 PrismaClient
系统 SHALL 使用 `@prisma/adapter-pg` 和 `pg.Pool` 创建 PrismaClient 实例，替代 Prisma 6 的内置查询引擎。

#### Scenario: 开发环境客户端单例
- **WHEN** 开发环境多次导入 prisma 模块
- **THEN** 返回同一个 PrismaClient 实例（通过 globalThis 缓存），避免热重载时创建多个连接池

#### Scenario: 生产环境每次创建新实例
- **WHEN** 生产环境导入 prisma 模块
- **THEN** 创建新的 PrismaClient 实例

### Requirement: 正确配置 SSL 连接
系统 SHALL 根据运行环境配置 PostgreSQL SSL 连接。

#### Scenario: 生产环境启用 SSL
- **WHEN** `NODE_ENV` 为 `production`
- **THEN** pg.Pool 使用 `ssl: { rejectUnauthorized: false }` 连接 Supabase

#### Scenario: 开发环境不启用 SSL
- **WHEN** `NODE_ENV` 为 `development`
- **THEN** pg.Pool 不使用 SSL 配置

### Requirement: 支持 pgvector 原始查询
系统 SHALL 通过 `$queryRaw` 执行 pgvector 向量相似度搜索。

#### Scenario: 向量搜索返回正确结果
- **WHEN** 调用 `searchRelevantChunks` 函数
- **THEN** 返回按向量距离排序的 top-K 文档片段

### Requirement: 兼容 Auth.js Prisma Adapter
系统 SHALL 与 `@auth/prisma-adapter` 正常工作。

#### Scenario: 用户登录成功
- **WHEN** 用户通过 credentials 登录
- **THEN** Auth.js 通过 Prisma adapter 查询用户并创建 JWT session

### Requirement: Prisma Client 生成到指定目录
系统 SHALL 将 Prisma Client 生成到 `generated/prisma` 目录。

#### Scenario: 运行 prisma generate
- **WHEN** 执行 `npx prisma generate`
- **THEN** 客户端文件生成到 `generated/prisma` 目录，可通过 `@/generated/prisma` 导入

