## Why

Prisma 7.x 将底层查询引擎从 Rust 二进制替换为纯 JavaScript 驱动适配器，显著减少包体积、提升查询性能，并提供更精细的连接池控制。升级到 7.x 可以保持依赖最新，同时为未来可能的性能优化打下基础。

## What Changes

- **BREAKING** 升级 `prisma` 和 `@prisma/client` 从 6.x 到 7.x
- **BREAKING** 安装 `@prisma/adapter-pg` 和 `pg` 作为数据库驱动适配器
- **BREAKING** 更新 `prisma/schema.prisma`：`provider` 从 `prisma-client-js` 改为 `prisma-client`，添加 `output` 路径
- 创建 `prisma.config.ts` 替代 datasource URL 环境变量配置
- 重写 `lib/prisma.ts`：使用 `pg.Pool` + `PrismaPg` adapter 初始化 PrismaClient
- 更新所有 `@prisma/client` 导入路径指向新的 output 目录
- 调整 npm scripts：`db:push`/`db:migrate` 不再自动触发 `prisma generate`

## Capabilities

### New Capabilities
- `prisma-driver-adapter`: 使用 pg 驱动适配器管理数据库连接池，替代 Prisma 内置的 Rust 查询引擎

### Modified Capabilities
<!-- 纯依赖升级，不涉及业务需求变更 -->
*(none)*

## Impact

**受影响的文件：**
- `package.json` — 依赖版本升级，新增依赖
- `prisma/schema.prisma` — generator 配置变更
- `prisma.config.ts` — 新建配置文件
- `lib/prisma.ts` — 客户端初始化逻辑完全重写
- `lib/vector-search.ts` — `$queryRaw` 需验证与 pg adapter 的兼容性
- `app/api/auth/[...nextauth]/auth.ts` — `@auth/prisma-adapter` 需确认兼容性
- 所有导入 `@prisma/client` 的文件 — 导入路径变更
- npm scripts — 数据库命令需显式调用 `prisma generate`

**运行时影响：**
- 数据库连接池从 Prisma 内置引擎切换为 `pg.Pool`，需配置合适的连接池大小
- Supabase SSL 连接需显式配置 `ssl.rejectUnauthorized`
- Vercel Serverless 环境下每个实例独立管理连接池
