# HTTP Handler API Specification

## Purpose
提供统一的 HTTP 响应处理和认证包装器，消除所有路由中重复的 `requireAuth()` 调用和错误处理。

## Requirements

### Requirement: withAuth 包装器
系统 SHALL 提供 `withAuth(handler)` 高阶函数，自动执行认证检查并注入 userId。

#### Scenario: 已认证用户
- **WHEN** 用户携带有效 session 发起请求
- **THEN** `handler(req, { userId })` 被调用，其中 `userId` 来自 session

#### Scenario: 未认证用户
- **WHEN** 请求没有或携带无效 session
- **THEN** 返回 `401 Unauthorized` JSON 响应，不调用 handler

#### Scenario: handler 抛出 ApiError
- **WHEN** handler 内抛出 `new ApiError(404, "Not found")`
- **THEN** 返回指定状态码 + `{ error: "Not found" }` 响应

#### Scenario: handler 抛出普通 Error
- **WHEN** handler 内抛出 `new Error("unexpected")`
- **THEN** 返回 `500 Internal Server Error` + `{ error: "An error occurred" }` 响应（不暴露原始消息）

### Requirement: withApi 包装器
系统 SHALL 提供 `withApi(handler)` 高阶函数，用于公开路由的统一错误处理。

#### Scenario: 正常响应
- **WHEN** handler 返回 `{ data: [...] }`
- **THEN** 返回 `200 OK` + JSON body

#### Scenario: handler 抛出错误
- **WHEN** handler 内抛出错误
- **THEN** 按 ApiError 状态码或默认 500 返回

### Requirement: ApiError 类
系统 SHALL 提供 `ApiError(statusCode, message, details?)` 类。

#### Scenario: 构造带详情
- **WHEN** `new ApiError(400, "Invalid input", [{ field: "email", issue: "invalid format" }])`
- **THEN** `status` 为 400，`message` 为 "Invalid input"，`details` 可访问

#### Scenario: 安全消息
- **WHEN** 外部序列化 `ApiError`
- **THEN** 只暴露 `status` 和 `message`，不暴露 stack trace 或内部细节

### Requirement: 统一错误响应格式
所有 API 错误响应 SHALL 遵循一致格式。

#### Scenario: 错误响应结构
- **WHEN** 任何错误发生
- **THEN** 响应体为 `{ error: string }` 或 `{ error: string, details?: unknown[] }`
