## 1. 升级依赖

- [x] 1.1 升级 `prisma` 和 `@prisma/client` 到 7.x
- [x] 1.2 安装 `@prisma/adapter-pg` 和 `pg`
- [x] 1.3 升级 `@auth/prisma-adapter` 到最新版

## 2. 更新 Prisma 配置

- [x] 2.1 更新 `prisma/schema.prisma` generator：`provider` 改为 `prisma-client`，添加 `output`
- [x] 2.2 创建 `prisma.config.ts` 配置文件
- [x] 2.3 更新 `.gitignore` 添加 `generated/` 目录

## 3. 重写客户端初始化

- [x] 3.1 重写 `lib/prisma.ts`：使用 `pg.Pool` + `PrismaPg` adapter 初始化 PrismaClient
- [x] 3.2 配置 SSL：生产环境 `rejectUnauthorized: false`，开发环境不启用

## 4. 更新导入路径

- [x] 4.1 更新 `lib/vector-search.ts` 的 Prisma 导入路径
- [x] 4.2 更新 `app/api/auth/[...nextauth]/auth.ts` 的 Prisma 导入路径
- [x] 4.3 更新 `app/api/documents/` 下所有路由的 Prisma 导入路径
- [x] 4.4 更新 `app/api/chat/` 下所有路由的 Prisma 导入路径
- [x] 4.5 更新 `app/api/register/route.ts` 的 Prisma 导入路径
- [x] 4.6 更新 `app/actions/` 下所有文件的 Prisma 导入路径
- [x] 4.7 更新 `app/dashboard/documents/page.tsx` 的 Prisma 导入路径

## 5. 调整构建脚本

- [x] 5.1 更新 `package.json` scripts：确保 `db:deploy` 包含 `prisma generate`
- [x] 5.2 更新 `setup` 脚本确保正确的执行顺序

## 6. 验证

- [x] 6.1 运行 `npx prisma generate` 生成客户端
- [x] 6.2 运行 `npm run typecheck` 验证类型检查通过
- [x] 6.3 运行 `npm run build` 验证构建通过
