# SQL Analytics Aggregation Specification

## Purpose
将分析数据的聚合计算从内存（JavaScript）迁移到 SQL 层，通过 `GROUP BY` + `date_trunc` 提升大数据集性能。

## Requirements

### Requirement: Dashboard Stats
系统 SHALL 通过 Prisma raw query 获取仪表盘统计数字，替代 4 个独立的 `count()` 查询。

#### Scenario: 获取统计数字
- **WHEN** `getDashboardStats(userId)` 被调用
- **THEN** 返回 `{ totalDocuments, totalChunks, totalSessions, totalMessages }`
- **THEN** 使用单次并发查询（Promise.all）获取所有数字

### Requirement: Documents Over Time
系统 SHALL 通过 SQL `GROUP BY date_trunc('day', created_at)` 获取文档上传时间序列。

#### Scenario: 有文档数据
- **WHEN** 用户在最近 7 天上传了 5 个文档
- **THEN** 返回按日期分组的结果：`[{ date: "2026-04-25", count: 2 }, ...]`
- **THEN** 不含数据的日期不返回（非零填充）
- **AND** 结果按 `date ASC` 排序

#### Scenario: 无文档数据
- **WHEN** 用户未上传任何文档
- **THEN** 返回空数组 `[]`

### Requirement: Chat Activity
系统 SHALL 通过 SQL 聚合获取最近 30 天的聊天活动趋势。

#### Scenario: 有聊天记录
- **WHEN** 用户在最近 14 天内发送了 20 条消息
- **THEN** 返回按日期分组的结果：`[{ date: "2026-04-18", count: 3 }, ...]`
- **THEN** 只包含最近 30 天的数据（`WHERE created_at >= NOW() - INTERVAL '30 days'`）

#### Scenario: 超出 30 天的记录
- **WHEN** 用户一个月前有聊天记录但最近无活动
- **THEN** 该日期的记录不被包含在结果中

### Requirement: Format Distribution
系统 SHALL 通过 SQL 聚合获取文档格式分布。

#### Scenario: 多种格式文档
- **WHEN** 用户有 3 个 PDF、2 个 TXT、1 个 DOCX
- **THEN** 返回：`[{ format: "PDF", count: 3 }, { format: "TXT", count: 2 }, { format: "DOCX", count: 1 }]`
- **THEN** 结果按 `count DESC` 排序

#### Scenario: 未知 MIME 类型
- **WHEN** 某文档的 mimeType 为 null 或异常值
- **THEN** 归类为 `"UNKNOWN"` 格式

### Requirement: 返回值兼容
SQL 聚合函数的返回值必须与原有 Server Action 的返回值类型完全兼容，确保上游消费者无需修改。

#### Scenario: getDashboardStats 返回值
- **WHEN** 原 `getDashboardStats()` 返回 `{ totalDocuments: 5, totalChunks: 42, totalSessions: 3, totalMessages: 28 }`
- **THEN** 新的 `analytics-service.ts` 返回完全相同的结构

#### Scenario: 时间序列返回值
- **WHEN** 原 `getDocumentsOverTime()` 返回 `[{ date: "2026-04-25", count: 2 }]`
- **THEN** 新的 `analytics-service.ts` 返回相同 `{ date: string, count: number }[]` 结构
