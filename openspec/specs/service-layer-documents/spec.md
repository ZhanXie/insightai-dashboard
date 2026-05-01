# Document Service Layer Specification

## Purpose
将文档域业务逻辑从 API Route 中提取到独立的 Service 层，提供统一的文档 CRUD、验证和处理流程。

## Requirements

### Requirement: Document CRUD
`document-service.ts` SHALL 提供用户文档列表、单文档查询和删除操作，所有操作均校验用户所有权。

#### Scenario: 列出用户文档
- **WHEN** `listDocuments(userId, options?)`
- **THEN** 按 `createdAt DESC` 排序返回用户的文档列表
- **AND** 仅包含基本信息（id, filename, fileSize, mimeType, status, chunkCount, createdAt）

#### Scenario: 获取单文档（所有权验证）
- **WHEN** `getDocument(documentId, userId)` 且文档不属于该用户
- **THEN** 抛出 `ApiError(404, "Document not found")`

#### Scenario: 删除文档（级联删除 chunks）
- **WHEN** `deleteDocument(documentId, userId)`
- **THEN** 删除 `documents` 表中对应记录及其关联的所有 chunks（通过 Prisma cascade）
- **AND** 返回被删除的文档 id

### Requirement: Document Validation
`document-validator.ts` SHALL 提供 MIME 类型和文件大小校验。

#### Scenario: 支持的 MIME 类型
- **WHEN** `validateMime("application/pdf")`
- **THEN** 返回 `{ valid: true, format: "pdf" }`

#### Scenario: 不支持的 MIME 类型
- **WHEN** `validateMime("application/x-executable")`
- **THEN** 抛出 `ApiError(400, "Unsupported file format")`

#### Scenario: 支持扩展名回退
- **WHEN** `validateExtension("docx")`
- **THEN** 返回 `{ valid: true, mimeType: "application/vnd.openxmlformats..." }`

### Requirement: Document Repository
`document-repository.ts` SHALL 封装所有与 Document/Chunk 模型相关的 Prisma 查询。

#### Scenario: 创建文档记录
- **WHEN** `createDocumentRecord(userId, filename, fileSize, mimeType, status?)`
- **THEN** 在 `documents` 表插入记录
- **AND** 默认 status = "pending"

#### Scenario: 更新文档状态
- **WHEN** `updateDocumentStatus(documentId, status, extra?)`
- **THEN** 更新 `documents` 表的 status 字段
- **AND** 如果提供 extra（如 `{ chunkCount }`），同步更新其他字段

#### Scenario: 批量插入 chunks
- **WHEN** `insertChunks(chunks)` 其中 chunks 为 `{ documentId, content, position, embeddingStr }[]`
- **THEN** 使用单个 `$executeRawUnsafe` 批量插入（或使用 transaction）
- **AND** 全部成功或全部回滚
