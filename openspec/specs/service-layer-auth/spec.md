# Auth Service Layer Specification

## Purpose
将认证域业务逻辑从 API Route 和 NextAuth config 中提取到独立的 Service 层，提供统一的用户查询、创建和密码处理。

## Requirements

### Requirement: User Lookup
`user-service.ts` SHALL 提供按邮箱查找用户的方法。

#### Scenario: 用户存在
- **WHEN** `findUserByEmail("user@example.com")`
- **THEN** 返回完整的 User 对象（含 passwordHash）
- **AND** 返回类型不含 Prisma 内部属性

#### Scenario: 用户不存在
- **WHEN** `findUserByEmail("nonexistent@example.com")`
- **THEN** 返回 `null`

### Requirement: User Creation
`user-service.ts` SHALL 提供用户创建方法，在创建前检查邮箱唯一性。

#### Scenario: 新用户注册
- **WHEN** `createUser(email, passwordHash, name?)`
- **THEN** 在 `users` 表插入记录
- **THEN** 返回创建的 User 对象（不含 passwordHash）

#### Scenario: 邮箱已注册
- **WHEN** `createUser("existing@example.com", "hash", "Name")` 且邮箱已存在
- **THEN** 抛出 `ApiError(409, "Email already registered")`

### Requirement: Password Operations
`password.ts` SHALL 提供密码哈希和验证的占位实现。

#### Scenario: 哈希密码
- **WHEN** `hashPassword("plaintext")`
- **THEN** 返回加密后的字符串（目前直接返回原文作为占位）

#### Scenario: 验证密码
- **WHEN** `verifyPassword("plaintext", hash)`
- **THEN** 返回比较结果布尔值（目前直接比较）

### Requirement: Shared NextAuth Config
`auth-config-base.ts` SHALL 包含所有 NextAuth 实例共用的配置选项。

#### Scenario: 配置内容完整
- **WHEN** 导入 `authConfigBase`
- **THEN** 包含 `providers`（Credentials provider）、`pages.signIn`、`session.strategy`、`callbacks.jwt`、`callbacks.session`

#### Scenario: Node.js 实例扩展基础配置
- **WHEN** `NextAuth({ ...authConfigBase, adapter })`
- **THEN** 合并后行为与重构前的 `auth.ts` 完全一致

#### Scenario: Edge 实例使用基础配置
- **WHEN** `NextAuth(authConfigBase)`
- **THEN** 不包含 adapter（Edge runtime 不支持 Prisma）
- **AND** 行为和重构前的 `auth.edge.ts` 完全一致
